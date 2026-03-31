"use client";

import {
    ExtensionLibraryEmptyMasonryPeek,
    ExtensionLibraryGrid,
    ExtensionLibrarySection,
} from "@/components/library/extension-library-grid";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandCollection,
    CommandEmpty,
    CommandGroup,
    CommandGroupLabel,
    CommandInput,
    CommandItem,
    CommandList,
    CommandPanel,
    CommandShortcut,
} from "@/components/ui/command";
import {
    Select,
    SelectItem,
    SelectPopup,
    SelectTrigger,
} from "@/components/ui/select";
import { useSearchQuery } from "@/hooks/use-search-query";
import { cn } from "@/lib/utils";
import type { LibraryItem } from "@/prisma/client/client";
import { LibraryItemSource } from "@/prisma/client/enums";
import { XIcon } from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    type PointerEvent as ReactPointerEvent,
    useRef,
    useState,
} from "react";

/** Base UI combobox close reason when an item is activated (inline mode still emits this). */
const COMBOBOX_ITEM_PRESS_REASON = "item-press";
const ALL_DOMAIN_FILTER = "__all_domains__";
const COLUMN_COUNT_STORAGE_KEY = "cache-library-column-count";
const TEXT_COLLATOR = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
});
const WWW_PREFIX_RE = /^www\./;

type GroupByMode = "none" | "source" | "domain" | "month";
type SortMode =
    | "newest"
    | "oldest"
    | "caption-asc"
    | "caption-desc"
    | "source"
    | "domain";
type SourceFilter = "all" | LibraryItemSource;
type ThumbnailFilter = "any" | "with" | "without";
type CaptionFilter = "any" | "with" | "without";
type ColumnCountMode = "auto" | "2" | "3" | "4" | "5" | "6";
type PaletteSection = "search" | "filter" | "group" | "sort" | "layout";

const DEFAULT_SORT_MODE: SortMode = "newest";
const DEFAULT_COLUMN_COUNT_MODE: ColumnCountMode = "auto";

interface BrowserSelectOption {
    readonly label: string;
    readonly value: string;
}

interface CommandPaletteItem {
    readonly active?: boolean;
    readonly description?: string;
    readonly label: string;
    readonly onSelect: () => void | Promise<void>;
    readonly shortcut?: string;
    readonly value: string;
}

interface CommandPaletteGroup {
    readonly items: CommandPaletteItem[];
    readonly label: string;
}

interface LibraryBrowserSection {
    readonly items: LibraryItem[];
    readonly key: string;
    readonly title: string | null;
}

interface SectionCollapseState {
    readonly collapseAllSections: () => void;
    readonly collapsedSectionKeys: string[];
    readonly enableSectionCollapse: boolean;
    readonly expandAllSections: () => void;
    readonly toggleSection: (key: string) => void;
}

function itemDomain(url: string): string {
    try {
        return new URL(url).hostname.replace(WWW_PREFIX_RE, "") || "Other";
    } catch {
        return "Other";
    }
}

function itemDate(item: LibraryItem): Date {
    const value = item.scrapedAt ?? item.createdAt;
    return value instanceof Date ? value : new Date(value);
}

function itemTimestamp(item: LibraryItem): number {
    return itemDate(item).getTime();
}

function itemMonthKey(item: LibraryItem): string {
    const date = itemDate(item);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}

function itemPrimaryText(item: LibraryItem): string {
    const caption = item.caption?.trim();
    return caption && caption.length > 0 ? caption : item.url;
}

function sourceLabel(source: LibraryItemSource): string {
    if (source === LibraryItemSource.google_photos) {
        return "Google Photos";
    }
    if (source === LibraryItemSource.instagram) {
        return "Instagram";
    }
    if (source === LibraryItemSource.pinterest) {
        return "Pinterest";
    }
    if (source === LibraryItemSource.tiktok) {
        return "TikTok";
    }
    return "Other";
}

function formatGroupHeading(mode: GroupByMode, key: string): string {
    if (mode === "source") {
        return sourceLabel(key as LibraryItemSource);
    }
    if (mode === "month") {
        const [ys, ms] = key.split("-");
        const y = Number(ys);
        const m = Number(ms);
        if (!(Number.isFinite(y) && Number.isFinite(m))) {
            return key;
        }
        return new Date(y, m - 1).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
        });
    }
    return key;
}

function compareItems(
    a: LibraryItem,
    b: LibraryItem,
    sortMode: SortMode
): number {
    if (sortMode === "newest") {
        return (
            itemTimestamp(b) - itemTimestamp(a) ||
            TEXT_COLLATOR.compare(itemPrimaryText(a), itemPrimaryText(b))
        );
    }
    if (sortMode === "oldest") {
        return (
            itemTimestamp(a) - itemTimestamp(b) ||
            TEXT_COLLATOR.compare(itemPrimaryText(a), itemPrimaryText(b))
        );
    }
    if (sortMode === "caption-asc") {
        return (
            TEXT_COLLATOR.compare(itemPrimaryText(a), itemPrimaryText(b)) ||
            itemTimestamp(b) - itemTimestamp(a)
        );
    }
    if (sortMode === "caption-desc") {
        return (
            TEXT_COLLATOR.compare(itemPrimaryText(b), itemPrimaryText(a)) ||
            itemTimestamp(b) - itemTimestamp(a)
        );
    }
    if (sortMode === "source") {
        return (
            TEXT_COLLATOR.compare(
                sourceLabel(a.source),
                sourceLabel(b.source)
            ) || TEXT_COLLATOR.compare(itemPrimaryText(a), itemPrimaryText(b))
        );
    }
    return (
        TEXT_COLLATOR.compare(itemDomain(a.url), itemDomain(b.url)) ||
        TEXT_COLLATOR.compare(itemPrimaryText(a), itemPrimaryText(b))
    );
}

function compareSectionKeys(
    a: string,
    b: string,
    groupBy: GroupByMode,
    sortMode: SortMode
): number {
    if (groupBy === "month") {
        return sortMode === "oldest" ? a.localeCompare(b) : b.localeCompare(a);
    }
    if (groupBy === "source") {
        return TEXT_COLLATOR.compare(
            formatGroupHeading(groupBy, a),
            formatGroupHeading(groupBy, b)
        );
    }
    return TEXT_COLLATOR.compare(a, b);
}

function truncateLabel(label: string, max = 22): string {
    return label.length > max ? `${label.slice(0, max)}…` : label;
}

function sortModeLabel(mode: SortMode): string {
    if (mode === "oldest") {
        return "Oldest first";
    }
    if (mode === "caption-asc") {
        return "Caption A-Z";
    }
    if (mode === "caption-desc") {
        return "Caption Z-A";
    }
    if (mode === "source") {
        return "Source";
    }
    if (mode === "domain") {
        return "Domain";
    }
    return "Newest first";
}

function groupByLabel(mode: GroupByMode): string {
    if (mode === "source") {
        return "Source";
    }
    if (mode === "domain") {
        return "Domain";
    }
    if (mode === "month") {
        return "Month";
    }
    return "None";
}

function sourceFilterLabel(source: SourceFilter): string {
    return source === "all" ? "All sources" : sourceLabel(source);
}

function thumbnailFilterLabel(filter: ThumbnailFilter): string {
    if (filter === "with") {
        return "With preview";
    }
    if (filter === "without") {
        return "Without preview";
    }
    return "Any preview";
}

function captionFilterLabel(filter: CaptionFilter): string {
    if (filter === "with") {
        return "With caption";
    }
    if (filter === "without") {
        return "Without caption";
    }
    return "Any caption";
}

function columnCountLabel(mode: ColumnCountMode): string {
    return mode === "auto" ? "Auto columns" : `${mode} columns`;
}

function PaletteChip({
    label,
    onRemove,
}: {
    readonly label: string;
    readonly onRemove: () => void;
}) {
    return (
        <span className="inline-flex max-w-[min(100%,12rem)] items-center gap-0.5 rounded-md border border-border/60 bg-background/90 py-0.5 ps-2 pe-0.5 font-medium text-foreground text-xs shadow-xs/5 dark:bg-background/40">
            <span className="min-w-0 truncate">{label}</span>
            <button
                aria-label={`Remove ${label}`}
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition hover:bg-muted/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onRemove();
                }}
                type="button"
            >
                <XIcon className="size-3.5 shrink-0 opacity-80" />
            </button>
        </span>
    );
}

function BrowserSelect({
    className,
    label,
    onValueChange,
    options,
    value,
}: {
    readonly className?: string;
    readonly label: string;
    readonly onValueChange: (value: string) => void;
    readonly options: readonly BrowserSelectOption[];
    readonly value: string;
}) {
    const selectedOption =
        options.find((option) => option.value === value) ?? options[0];

    return (
        <Select
            onValueChange={(nextValue) => {
                if (nextValue !== null) {
                    onValueChange(nextValue);
                }
            }}
            value={value}
        >
            <SelectTrigger
                className={cn(
                    "min-w-[10.5rem] rounded-full bg-background/90 shadow-none",
                    className
                )}
                size="sm"
            >
                <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                    <span className="shrink-0 text-muted-foreground text-xs">
                        {label}
                    </span>
                    <span className="truncate text-sm">
                        {selectedOption?.label}
                    </span>
                </span>
            </SelectTrigger>
            <SelectPopup>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectPopup>
        </Select>
    );
}

function renderLibraryGridBody({
    collapsedSectionKeys,
    clearLibraryPalette,
    columnCount,
    enableSectionCollapse,
    onToggleSection,
    sections,
    showEmptyLibraryPeek,
    showNoFilteredResults,
}: {
    readonly collapsedSectionKeys: ReadonlySet<string>;
    readonly clearLibraryPalette: () => Promise<void>;
    readonly columnCount?: number;
    readonly enableSectionCollapse: boolean;
    readonly onToggleSection: (key: string) => void;
    readonly sections: readonly LibraryBrowserSection[];
    readonly showEmptyLibraryPeek: boolean;
    readonly showNoFilteredResults: boolean;
}): ReactNode {
    if (showEmptyLibraryPeek) {
        return <ExtensionLibraryEmptyMasonryPeek />;
    }

    if (showNoFilteredResults) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 border-dashed bg-card/30 px-6 py-14 text-center">
                <p className="max-w-md text-balance text-muted-foreground text-sm">
                    No saved items match the current search and filters.
                </p>
                <Button
                    onClick={() => clearLibraryPalette().catch(() => undefined)}
                    size="sm"
                    variant="outline"
                >
                    Reset browser
                </Button>
            </div>
        );
    }

    return sections.map((section) =>
        enableSectionCollapse ? (
            <ExtensionLibrarySection
                collapsed={collapsedSectionKeys.has(section.key)}
                collapsible
                columnCount={columnCount}
                emptyHint="No saved items in this section."
                items={section.items}
                key={section.key}
                onToggle={() => onToggleSection(section.key)}
                summaryLabel={section.title ? undefined : "Filtered view"}
                title={section.title ?? "Results"}
            />
        ) : (
            <section className="flex w-full flex-col gap-3" key={section.key}>
                {section.title ? (
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="font-medium text-foreground text-sm">
                            {section.title}
                        </h2>
                        <span className="text-muted-foreground text-xs tabular-nums">
                            {section.items.length} item
                            {section.items.length === 1 ? "" : "s"}
                        </span>
                    </div>
                ) : null}
                <ExtensionLibraryGrid
                    columnCount={columnCount}
                    items={section.items}
                />
            </section>
        )
    );
}

function useSectionCollapseState({
    groupBy,
    hasActiveFilters,
    sections,
    showEmptyLibraryPeek,
    showNoFilteredResults,
}: {
    readonly groupBy: GroupByMode;
    readonly hasActiveFilters: boolean;
    readonly sections: readonly LibraryBrowserSection[];
    readonly showEmptyLibraryPeek: boolean;
    readonly showNoFilteredResults: boolean;
}): SectionCollapseState {
    const [collapsedSectionKeys, setCollapsedSectionKeys] = useState<string[]>(
        []
    );

    const enableSectionCollapse =
        !(showEmptyLibraryPeek || showNoFilteredResults) &&
        (hasActiveFilters || groupBy !== "none");

    useEffect(() => {
        const validKeys = new Set(sections.map((section) => section.key));
        setCollapsedSectionKeys((current) => {
            const next = current.filter((key) => validKeys.has(key));
            return next.length === current.length ? current : next;
        });
    }, [sections]);

    useEffect(() => {
        if (!enableSectionCollapse) {
            setCollapsedSectionKeys((current) =>
                current.length === 0 ? current : []
            );
        }
    }, [enableSectionCollapse]);

    const toggleSection = useCallback((key: string) => {
        setCollapsedSectionKeys((current) =>
            current.includes(key)
                ? current.filter((entry) => entry !== key)
                : [...current, key]
        );
    }, []);

    const collapseAllSections = useCallback(() => {
        setCollapsedSectionKeys(sections.map((section) => section.key));
    }, [sections]);

    const expandAllSections = useCallback(() => {
        setCollapsedSectionKeys([]);
    }, []);

    return {
        collapseAllSections,
        collapsedSectionKeys,
        enableSectionCollapse,
        expandAllSections,
        toggleSection,
    };
}

function LibraryPaletteTrailing({
    captionFilter,
    clearLibraryPalette,
    columnCountMode,
    domainFilter,
    groupBy,
    paletteInput,
    searchQuery,
    setCaptionFilter,
    setColumnCountMode,
    setDomainFilter,
    setGroupBy,
    setSearchQuery,
    setSortMode,
    setSourceFilter,
    setThumbFilter,
    sortMode,
    sourceFilter,
    thumbFilter,
}: {
    readonly captionFilter: CaptionFilter;
    readonly clearLibraryPalette: () => Promise<void>;
    readonly columnCountMode: ColumnCountMode;
    readonly domainFilter: string;
    readonly groupBy: GroupByMode;
    readonly paletteInput: string;
    readonly searchQuery: string;
    readonly setCaptionFilter: (value: CaptionFilter) => void;
    readonly setColumnCountMode: (value: ColumnCountMode) => void;
    readonly setDomainFilter: (value: string) => void;
    readonly setGroupBy: (value: GroupByMode) => void;
    readonly setSearchQuery: (value: null) => Promise<unknown>;
    readonly setSortMode: (value: SortMode) => void;
    readonly setSourceFilter: (value: SourceFilter) => void;
    readonly setThumbFilter: (value: ThumbnailFilter) => void;
    readonly sortMode: SortMode;
    readonly sourceFilter: SourceFilter;
    readonly thumbFilter: ThumbnailFilter;
}) {
    const chips: ReactNode[] = [];
    const q = searchQuery.trim();

    if (q) {
        chips.push(
            <PaletteChip
                key="search"
                label={`Search: ${truncateLabel(q)}`}
                onRemove={() => {
                    setSearchQuery(null).catch(() => undefined);
                }}
            />
        );
    }

    if (sourceFilter !== "all") {
        chips.push(
            <PaletteChip
                key="source"
                label={`Source: ${sourceFilterLabel(sourceFilter)}`}
                onRemove={() => setSourceFilter("all")}
            />
        );
    }

    if (thumbFilter !== "any") {
        chips.push(
            <PaletteChip
                key="thumb"
                label={thumbnailFilterLabel(thumbFilter)}
                onRemove={() => setThumbFilter("any")}
            />
        );
    }

    if (captionFilter !== "any") {
        chips.push(
            <PaletteChip
                key="caption"
                label={captionFilterLabel(captionFilter)}
                onRemove={() => setCaptionFilter("any")}
            />
        );
    }

    if (domainFilter !== ALL_DOMAIN_FILTER) {
        chips.push(
            <PaletteChip
                key="domain"
                label={`Domain: ${truncateLabel(domainFilter)}`}
                onRemove={() => setDomainFilter(ALL_DOMAIN_FILTER)}
            />
        );
    }

    if (groupBy !== "none") {
        chips.push(
            <PaletteChip
                key="group"
                label={`Group: ${groupByLabel(groupBy)}`}
                onRemove={() => setGroupBy("none")}
            />
        );
    }

    if (sortMode !== DEFAULT_SORT_MODE) {
        chips.push(
            <PaletteChip
                key="sort"
                label={`Sort: ${sortModeLabel(sortMode)}`}
                onRemove={() => setSortMode(DEFAULT_SORT_MODE)}
            />
        );
    }

    if (columnCountMode !== DEFAULT_COLUMN_COUNT_MODE) {
        chips.push(
            <PaletteChip
                key="columns"
                label={`Layout: ${columnCountLabel(columnCountMode)}`}
                onRemove={() => setColumnCountMode(DEFAULT_COLUMN_COUNT_MODE)}
            />
        );
    }

    const canReset = chips.length > 0 || paletteInput.trim().length > 0;

    return (
        <>
            {chips}
            {canReset ? (
                <Button
                    aria-label="Clear search, filters, grouping, sorting, layout, and command input"
                    className="size-8 shrink-0 rounded-full text-muted-foreground sm:size-7"
                    onClick={() => {
                        clearLibraryPalette().catch(() => undefined);
                    }}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                >
                    <XIcon className="size-4 opacity-80 sm:size-3.5" />
                </Button>
            ) : null}
        </>
    );
}

interface Props {
    readonly items: LibraryItem[];
}

export function LibraryBrowser({ items }: Props) {
    const [searchQuery, setSearchQuery] = useSearchQuery();
    const [paletteInput, setPaletteInput] = useState("");
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
    const [thumbFilter, setThumbFilter] = useState<ThumbnailFilter>("any");
    const [captionFilter, setCaptionFilter] = useState<CaptionFilter>("any");
    const [domainFilter, setDomainFilter] = useState<string>(ALL_DOMAIN_FILTER);
    const [groupBy, setGroupBy] = useState<GroupByMode>("none");
    const [sortMode, setSortMode] = useState<SortMode>(DEFAULT_SORT_MODE);
    const [columnCountMode, setColumnCountMode] = useState<ColumnCountMode>(
        DEFAULT_COLUMN_COUNT_MODE
    );
    const [paletteSection, setPaletteSection] =
        useState<PaletteSection>("search");
    const [commandListOpen, setCommandListOpen] = useState(false);
    const commandPanelContainerRef = useRef<HTMLDivElement>(null);
    const paletteInputRef = useRef<HTMLInputElement>(null);
    /** Skips one combobox-driven close right after entering a drill-down section. */
    const suppressNextCommandCloseRef = useRef(false);

    const sourceOptions = useMemo<BrowserSelectOption[]>(
        () => [
            { label: "All sources", value: "all" },
            {
                label: sourceLabel(LibraryItemSource.google_photos),
                value: LibraryItemSource.google_photos,
            },
            {
                label: sourceLabel(LibraryItemSource.instagram),
                value: LibraryItemSource.instagram,
            },
            {
                label: sourceLabel(LibraryItemSource.pinterest),
                value: LibraryItemSource.pinterest,
            },
            {
                label: sourceLabel(LibraryItemSource.tiktok),
                value: LibraryItemSource.tiktok,
            },
            { label: sourceLabel(LibraryItemSource.other), value: "other" },
        ],
        []
    );

    const thumbnailOptions = useMemo<BrowserSelectOption[]>(
        () => [
            { label: "Any preview", value: "any" },
            { label: "With preview", value: "with" },
            { label: "Without preview", value: "without" },
        ],
        []
    );

    const captionOptions = useMemo<BrowserSelectOption[]>(
        () => [
            { label: "Any caption", value: "any" },
            { label: "With caption", value: "with" },
            { label: "Without caption", value: "without" },
        ],
        []
    );

    const sortOptions = useMemo<BrowserSelectOption[]>(
        () => [
            { label: "Newest first", value: "newest" },
            { label: "Oldest first", value: "oldest" },
            { label: "Caption A-Z", value: "caption-asc" },
            { label: "Caption Z-A", value: "caption-desc" },
            { label: "Source", value: "source" },
            { label: "Domain", value: "domain" },
        ],
        []
    );

    const groupOptions = useMemo<BrowserSelectOption[]>(
        () => [
            { label: "No grouping", value: "none" },
            { label: "Source", value: "source" },
            { label: "Domain", value: "domain" },
            { label: "Month", value: "month" },
        ],
        []
    );

    const columnOptions = useMemo<BrowserSelectOption[]>(
        () => [
            { label: "Auto columns", value: "auto" },
            { label: "2 columns", value: "2" },
            { label: "3 columns", value: "3" },
            { label: "4 columns", value: "4" },
            { label: "5 columns", value: "5" },
            { label: "6 columns", value: "6" },
        ],
        []
    );

    const domainOptions = useMemo<BrowserSelectOption[]>(() => {
        const counts = new Map<string, number>();
        for (const item of items) {
            const domain = itemDomain(item.url);
            counts.set(domain, (counts.get(domain) ?? 0) + 1);
        }

        const dynamicDomains = Array.from(counts.entries())
            .sort(
                ([aDomain, aCount], [bDomain, bCount]) =>
                    bCount - aCount || TEXT_COLLATOR.compare(aDomain, bDomain)
            )
            .map(([domain, count]) => ({
                label: `${domain} (${count})`,
                value: domain,
            }));

        return [
            { label: "All domains", value: ALL_DOMAIN_FILTER },
            ...dynamicDomains,
        ];
    }, [items]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const storedValue = window.localStorage.getItem(
            COLUMN_COUNT_STORAGE_KEY
        );
        if (
            storedValue === "auto" ||
            storedValue === "2" ||
            storedValue === "3" ||
            storedValue === "4" ||
            storedValue === "5" ||
            storedValue === "6"
        ) {
            setColumnCountMode(storedValue);
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        window.localStorage.setItem(COLUMN_COUNT_STORAGE_KEY, columnCountMode);
    }, [columnCountMode]);

    const focusPaletteInput = useCallback((select = false) => {
        setCommandListOpen(true);
        queueMicrotask(() => {
            paletteInputRef.current?.focus();
            if (select) {
                paletteInputRef.current?.select();
            }
        });
    }, []);

    const handleCommandOpenChange = useCallback(
        (nextOpen: boolean, eventDetails?: { readonly reason?: string }) => {
            setCommandListOpen(() => {
                if (!nextOpen && suppressNextCommandCloseRef.current) {
                    suppressNextCommandCloseRef.current = false;
                    return true;
                }

                if (!nextOpen) {
                    const shell = commandPanelContainerRef.current;
                    const active = document.activeElement;
                    const focusInsidePalette =
                        shell &&
                        active instanceof Node &&
                        shell.contains(active);
                    const reason = eventDetails?.reason;

                    // Inline autocomplete always requests close on item pick; keep the list
                    // visible while focus stays in the palette so the field matches the list.
                    if (
                        focusInsidePalette &&
                        reason === COMBOBOX_ITEM_PRESS_REASON
                    ) {
                        return true;
                    }
                }

                if (nextOpen) {
                    suppressNextCommandCloseRef.current = false;
                }

                return nextOpen;
            });
        },
        []
    );

    const handlePaletteShellPointerDownCapture = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }
            if (!target.closest("[data-library-command-field]")) {
                return;
            }
            if (target.closest("[data-library-palette-trailing]")) {
                return;
            }
            setCommandListOpen(true);
        },
        []
    );

    useLayoutEffect(() => {
        const el = commandPanelContainerRef.current;
        if (!el) {
            return;
        }

        const handleFocusIn = (event: globalThis.FocusEvent) => {
            if (event.target instanceof HTMLInputElement) {
                setCommandListOpen(true);
            }
        };

        const handleFocusOut = (event: globalThis.FocusEvent) => {
            const { relatedTarget } = event;
            if (relatedTarget instanceof Node && el.contains(relatedTarget)) {
                return;
            }
            const closeIfLeft = () => {
                if (!el.contains(document.activeElement)) {
                    setCommandListOpen(false);
                }
            };
            queueMicrotask(closeIfLeft);
            window.setTimeout(closeIfLeft, 0);
        };

        el.addEventListener("focusin", handleFocusIn);
        el.addEventListener("focusout", handleFocusOut);
        return () => {
            el.removeEventListener("focusin", handleFocusIn);
            el.removeEventListener("focusout", handleFocusOut);
        };
    }, []);

    useEffect(() => {
        const handleWindowKeyDown = (event: KeyboardEvent) => {
            const target = event.target;
            const isEditable =
                target instanceof HTMLElement &&
                (target.isContentEditable ||
                    Boolean(
                        target.closest(
                            'input, textarea, select, button, [role="textbox"]'
                        )
                    ));

            if (
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === "k"
            ) {
                event.preventDefault();
                focusPaletteInput(true);
                return;
            }

            if (
                event.key === "/" &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.altKey &&
                !isEditable
            ) {
                event.preventDefault();
                focusPaletteInput();
            }
        };

        window.addEventListener("keydown", handleWindowKeyDown);
        return () => {
            window.removeEventListener("keydown", handleWindowKeyDown);
        };
    }, [focusPaletteInput]);

    const returnToSearchSection = useCallback(() => {
        setPaletteSection("search");
        setPaletteInput("");
        setCommandListOpen(true);
    }, []);

    const openPaletteSection = useCallback(
        (section: Exclude<PaletteSection, "search">) => {
            suppressNextCommandCloseRef.current = true;
            setPaletteSection(section);
            setPaletteInput("");
            focusPaletteInput();
        },
        [focusPaletteInput]
    );

    const handlePaletteInputChange = useCallback((next: string) => {
        setPaletteInput(next);
        setCommandListOpen(true);
    }, []);

    const handlePaletteInputKeyDown = useCallback(
        (event: ReactKeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Escape") {
                event.preventDefault();
                if (paletteInput.trim() !== "") {
                    setPaletteInput("");
                    setCommandListOpen(true);
                    return;
                }
                if (paletteSection !== "search") {
                    returnToSearchSection();
                    return;
                }
                setCommandListOpen(false);
                event.currentTarget.blur();
                return;
            }

            if (
                event.key === "Backspace" &&
                paletteSection !== "search" &&
                paletteInput.trim() === ""
            ) {
                event.preventDefault();
                returnToSearchSection();
                return;
            }

            if (event.key === "ArrowDown" && !commandListOpen) {
                setCommandListOpen(true);
            }
        },
        [commandListOpen, paletteInput, paletteSection, returnToSearchSection]
    );

    const clearLibraryPalette = useCallback(async () => {
        setPaletteInput("");
        setSourceFilter("all");
        setThumbFilter("any");
        setCaptionFilter("any");
        setDomainFilter(ALL_DOMAIN_FILTER);
        setGroupBy("none");
        setSortMode(DEFAULT_SORT_MODE);
        setColumnCountMode(DEFAULT_COLUMN_COUNT_MODE);
        setPaletteSection("search");
        await setSearchQuery(null);
        setCommandListOpen(false);
    }, [setSearchQuery]);

    const paletteGroups = useMemo<CommandPaletteGroup[]>(() => {
        const draft = paletteInput.trim();
        const groups: CommandPaletteGroup[] = [];

        const applyAndReturn = (fn: () => void | Promise<void>) => async () => {
            await fn();
            returnToSearchSection();
        };

        const navigationItems: CommandPaletteItem[] = [
            {
                description: "Source, preview, caption, and domain filters",
                label: "Filter by…",
                onSelect: () => openPaletteSection("filter"),
                value: "navigate filters",
            },
            {
                description: `Current: ${groupByLabel(groupBy)}`,
                label: "Group by…",
                onSelect: () => openPaletteSection("group"),
                value: "navigate grouping",
            },
            {
                description: `Current: ${sortModeLabel(sortMode)}`,
                label: "Sort by…",
                onSelect: () => openPaletteSection("sort"),
                value: "navigate sorting",
            },
            {
                description: `Current: ${columnCountLabel(columnCountMode)}`,
                label: "Layout…",
                onSelect: () => openPaletteSection("layout"),
                value: "navigate layout",
            },
        ];

        const backItem: CommandPaletteItem = {
            description: "Return to search and quick actions",
            label: "Back",
            onSelect: returnToSearchSection,
            shortcut: "Esc",
            value: "navigate back",
        };

        if (paletteSection === "search") {
            if (draft) {
                groups.push({
                    items: [
                        {
                            description: "Match captions and URLs",
                            label: `Search for "${draft}"`,
                            onSelect: async () => {
                                await setSearchQuery(draft || null);
                                setPaletteInput("");
                                setCommandListOpen(true);
                            },
                            shortcut: "Enter",
                            value: `apply search ${draft}`,
                        },
                    ],
                    label: "Search",
                });
            }

            if (searchQuery.trim()) {
                groups.push({
                    items: [
                        {
                            description: `Current: ${truncateLabel(searchQuery.trim(), 28)}`,
                            label: "Clear current search",
                            onSelect: async () => {
                                await setSearchQuery(null);
                                setCommandListOpen(true);
                            },
                            value: "clear search",
                        },
                    ],
                    label: "Current search",
                });
            }

            groups.push({
                items: navigationItems,
                label: "Refine library",
            });

            if (
                searchQuery.trim() ||
                sourceFilter !== "all" ||
                thumbFilter !== "any" ||
                captionFilter !== "any" ||
                domainFilter !== ALL_DOMAIN_FILTER ||
                groupBy !== "none" ||
                sortMode !== DEFAULT_SORT_MODE ||
                columnCountMode !== DEFAULT_COLUMN_COUNT_MODE
            ) {
                groups.push({
                    items: [
                        {
                            description:
                                "Reset search, filters, grouping, sort, and layout",
                            label: "Reset browser",
                            onSelect: clearLibraryPalette,
                            value: "reset browser state",
                        },
                    ],
                    label: "Quick actions",
                });
            }

            return groups;
        }

        if (paletteSection === "filter") {
            groups.push({
                items: [backItem],
                label: "Navigation",
            });
            groups.push({
                items: [
                    {
                        active: sourceFilter === "all",
                        description: "Show every source",
                        label: "Source: All sources",
                        onSelect: applyAndReturn(() => setSourceFilter("all")),
                        value: "filter source all",
                    },
                    ...sourceOptions
                        .filter((option) => option.value !== "all")
                        .map((option) => ({
                            active: sourceFilter === option.value,
                            description: "Limit the grid to one source",
                            label: `Source: ${option.label}`,
                            onSelect: applyAndReturn(() =>
                                setSourceFilter(option.value as SourceFilter)
                            ),
                            value: `filter source ${option.value}`,
                        })),
                    ...thumbnailOptions.map((option) => ({
                        active: thumbFilter === option.value,
                        description: "Filter items by preview availability",
                        label: `Preview: ${option.label}`,
                        onSelect: applyAndReturn(() =>
                            setThumbFilter(option.value as ThumbnailFilter)
                        ),
                        value: `filter preview ${option.value}`,
                    })),
                    ...captionOptions.map((option) => ({
                        active: captionFilter === option.value,
                        description: "Filter items by caption presence",
                        label: `Caption: ${option.label}`,
                        onSelect: applyAndReturn(() =>
                            setCaptionFilter(option.value as CaptionFilter)
                        ),
                        value: `filter caption ${option.value}`,
                    })),
                ],
                label: "Conditions",
            });
            groups.push({
                items: domainOptions.map((option) => ({
                    active: domainFilter === option.value,
                    description:
                        option.value === ALL_DOMAIN_FILTER
                            ? "Show items from every domain"
                            : "Limit the grid to one hostname",
                    label: `Domain: ${option.label}`,
                    onSelect: applyAndReturn(() =>
                        setDomainFilter(option.value)
                    ),
                    value: `filter domain ${option.value}`,
                })),
                label: "Domain",
            });
            return groups;
        }

        if (paletteSection === "group") {
            return [
                { items: [backItem], label: "Navigation" },
                {
                    items: groupOptions.map((option) => ({
                        active: groupBy === option.value,
                        description: "Organize the grid into sections",
                        label: option.label,
                        onSelect: applyAndReturn(() =>
                            setGroupBy(option.value as GroupByMode)
                        ),
                        value: `group ${option.value}`,
                    })),
                    label: "Grouping",
                },
            ];
        }

        if (paletteSection === "sort") {
            return [
                { items: [backItem], label: "Navigation" },
                {
                    items: sortOptions.map((option) => ({
                        active: sortMode === option.value,
                        description:
                            "Change the ordering within the current view",
                        label: option.label,
                        onSelect: applyAndReturn(() =>
                            setSortMode(option.value as SortMode)
                        ),
                        value: `sort ${option.value}`,
                    })),
                    label: "Sorting",
                },
            ];
        }

        return [
            { items: [backItem], label: "Navigation" },
            {
                items: columnOptions.map((option) => ({
                    active: columnCountMode === option.value,
                    description:
                        option.value === "auto"
                            ? "Let the masonry adapt to the available width"
                            : "Force a specific number of columns",
                    label: option.label,
                    onSelect: applyAndReturn(() =>
                        setColumnCountMode(option.value as ColumnCountMode)
                    ),
                    value: `columns ${option.value}`,
                })),
                label: "Layout",
            },
        ];
    }, [
        captionFilter,
        clearLibraryPalette,
        columnCountMode,
        columnOptions,
        domainFilter,
        domainOptions,
        groupBy,
        groupOptions,
        openPaletteSection,
        paletteInput,
        paletteSection,
        returnToSearchSection,
        searchQuery,
        setSearchQuery,
        sortMode,
        sortOptions,
        sourceFilter,
        sourceOptions,
        thumbFilter,
        thumbnailOptions,
        captionOptions,
    ]);

    let inputPlaceholder = "Change the layout…";
    if (paletteSection === "search") {
        inputPlaceholder = "Search your library or jump to a command…";
    } else if (paletteSection === "filter") {
        inputPlaceholder = "Filter the library…";
    } else if (paletteSection === "group") {
        inputPlaceholder = "Group results…";
    } else if (paletteSection === "sort") {
        inputPlaceholder = "Sort results…";
    }

    const filteredItems = useMemo(() => {
        let list = items;
        const q = searchQuery.trim().toLowerCase();

        if (q) {
            list = list.filter((item) => {
                const cap = item.caption?.toLowerCase() ?? "";
                const url = item.url.toLowerCase();
                return cap.includes(q) || url.includes(q);
            });
        }

        if (sourceFilter !== "all") {
            list = list.filter((item) => item.source === sourceFilter);
        }

        if (thumbFilter === "with") {
            list = list.filter((item) => Boolean(item.thumbnailUrl));
        } else if (thumbFilter === "without") {
            list = list.filter((item) => !item.thumbnailUrl);
        }

        if (captionFilter === "with") {
            list = list.filter((item) => Boolean(item.caption?.trim()));
        } else if (captionFilter === "without") {
            list = list.filter((item) => !item.caption?.trim());
        }

        if (domainFilter !== ALL_DOMAIN_FILTER) {
            list = list.filter((item) => itemDomain(item.url) === domainFilter);
        }

        return list;
    }, [
        captionFilter,
        domainFilter,
        items,
        searchQuery,
        sourceFilter,
        thumbFilter,
    ]);

    const sortedItems = useMemo(
        () => [...filteredItems].sort((a, b) => compareItems(a, b, sortMode)),
        [filteredItems, sortMode]
    );

    const sections = useMemo(() => {
        if (groupBy === "none") {
            return [
                {
                    items: sortedItems,
                    key: "all",
                    title: null as string | null,
                },
            ];
        }

        const buckets = new Map<string, LibraryItem[]>();
        for (const item of sortedItems) {
            let key = "Other";
            if (groupBy === "source") {
                key = item.source;
            } else if (groupBy === "domain") {
                key = itemDomain(item.url);
            } else if (groupBy === "month") {
                key = itemMonthKey(item);
            }

            const bucket = buckets.get(key) ?? [];
            bucket.push(item);
            buckets.set(key, bucket);
        }

        return Array.from(buckets.entries())
            .sort(([a], [b]) => compareSectionKeys(a, b, groupBy, sortMode))
            .map(([key, sectionItems]) => ({
                items: sectionItems,
                key,
                title: formatGroupHeading(groupBy, key),
            }));
    }, [groupBy, sortMode, sortedItems]);

    const hasActiveFilters = useMemo(
        () =>
            searchQuery.trim() !== "" ||
            sourceFilter !== "all" ||
            thumbFilter !== "any" ||
            captionFilter !== "any" ||
            domainFilter !== ALL_DOMAIN_FILTER,
        [captionFilter, domainFilter, searchQuery, sourceFilter, thumbFilter]
    );

    const hasNonDefaultView =
        groupBy !== "none" ||
        sortMode !== DEFAULT_SORT_MODE ||
        columnCountMode !== DEFAULT_COLUMN_COUNT_MODE;

    const showEmptyLibraryPeek =
        items.length === 0 && filteredItems.length === 0 && !hasActiveFilters;

    const showNoFilteredResults =
        filteredItems.length === 0 && !showEmptyLibraryPeek;

    const {
        collapseAllSections,
        collapsedSectionKeys,
        enableSectionCollapse,
        expandAllSections,
        toggleSection,
    } = useSectionCollapseState({
        groupBy,
        hasActiveFilters,
        sections,
        showEmptyLibraryPeek,
        showNoFilteredResults,
    });

    const resolvedColumnCount =
        columnCountMode === "auto" ? undefined : Number(columnCountMode);

    const resultsSummary =
        filteredItems.length === items.length
            ? `${items.length} item${items.length === 1 ? "" : "s"}`
            : `${filteredItems.length} of ${items.length} items`;

    const libraryGridBody = renderLibraryGridBody({
        clearLibraryPalette,
        collapsedSectionKeys: new Set(collapsedSectionKeys),
        columnCount: resolvedColumnCount,
        enableSectionCollapse,
        onToggleSection: toggleSection,
        sections,
        showEmptyLibraryPeek,
        showNoFilteredResults,
    });

    return (
        <div className="flex w-full flex-col gap-6">
            <div className="flex w-full flex-col gap-3">
                <div
                    className="sticky top-3 z-20 w-full max-w-3xl"
                    onPointerDownCapture={handlePaletteShellPointerDownCapture}
                    ref={commandPanelContainerRef}
                >
                    <CommandPanel className="w-full" unstyled>
                        <Command
                            items={paletteGroups.map((group) => ({
                                items: group.items,
                            }))}
                            onOpenChange={handleCommandOpenChange}
                            onValueChange={handlePaletteInputChange}
                            open={commandListOpen}
                            value={paletteInput}
                        >
                            <CommandInput
                                autoFocus={false}
                                className="rounded-none border-0 bg-transparent! shadow-none outline-none ring-0 before:hidden has-focus-visible:border-transparent has-focus-visible:ring-0 has-focus-visible:ring-offset-0"
                                onKeyDown={handlePaletteInputKeyDown}
                                placeholder={inputPlaceholder}
                                ref={paletteInputRef}
                                trailing={
                                    <LibraryPaletteTrailing
                                        captionFilter={captionFilter}
                                        clearLibraryPalette={
                                            clearLibraryPalette
                                        }
                                        columnCountMode={columnCountMode}
                                        domainFilter={domainFilter}
                                        groupBy={groupBy}
                                        paletteInput={paletteInput}
                                        searchQuery={searchQuery}
                                        setCaptionFilter={setCaptionFilter}
                                        setColumnCountMode={setColumnCountMode}
                                        setDomainFilter={setDomainFilter}
                                        setGroupBy={setGroupBy}
                                        setSearchQuery={setSearchQuery}
                                        setSortMode={setSortMode}
                                        setSourceFilter={setSourceFilter}
                                        setThumbFilter={setThumbFilter}
                                        sortMode={sortMode}
                                        sourceFilter={sourceFilter}
                                        thumbFilter={thumbFilter}
                                    />
                                }
                                wrapperClassName="min-h-11 w-full rounded-full bg-muted/94 px-2 py-1.5 ring-1 ring-border/40 shadow-[0_0_0_rgba(15,23,42,0)] transition-[box-shadow,background-color] duration-200 has-focus-within:bg-background/96 has-focus-within:shadow-[0_10px_30px_rgba(15,23,42,0.10),0_1px_0_rgba(255,255,255,0.24)_inset] dark:ring-border/50 dark:shadow-[0_0_0_rgba(0,0,0,0)] dark:has-focus-within:shadow-[0_12px_32px_rgba(0,0,0,0.28),0_1px_0_rgba(255,255,255,0.05)_inset]"
                            />
                            <p className="sr-only">
                                Press Command K or Control K to focus search.
                                Use arrow keys to navigate results and Escape to
                                clear, go back, or close the command list.
                            </p>
                            <div
                                className={cn(
                                    !commandListOpen && "hidden",
                                    "absolute top-full left-0 z-50 mt-2 max-h-[min(26rem,70vh)] w-full overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-md"
                                )}
                            >
                                <CommandEmpty>
                                    No matching commands found.
                                </CommandEmpty>
                                <CommandList>
                                    {paletteGroups.map((group) => (
                                        <CommandGroup
                                            items={group.items}
                                            key={group.label}
                                        >
                                            <CommandGroupLabel>
                                                {group.label}
                                            </CommandGroupLabel>
                                            <CommandCollection>
                                                {(item: CommandPaletteItem) => (
                                                    <CommandItem
                                                        key={item.value}
                                                        onClick={item.onSelect}
                                                        value={item.value}
                                                    >
                                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="truncate">
                                                                    {item.label}
                                                                </div>
                                                                {item.description ? (
                                                                    <p className="truncate text-muted-foreground text-xs">
                                                                        {
                                                                            item.description
                                                                        }
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                            {item.active ? (
                                                                <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 font-medium text-[11px] text-accent-foreground">
                                                                    Active
                                                                </span>
                                                            ) : null}
                                                            {item.shortcut ? (
                                                                <CommandShortcut>
                                                                    {
                                                                        item.shortcut
                                                                    }
                                                                </CommandShortcut>
                                                            ) : null}
                                                        </div>
                                                    </CommandItem>
                                                )}
                                            </CommandCollection>
                                        </CommandGroup>
                                    ))}
                                </CommandList>
                            </div>
                        </Command>
                    </CommandPanel>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-8 items-center rounded-full border border-border/60 bg-card/60 px-3 font-medium text-muted-foreground text-xs tabular-nums">
                            {resultsSummary}
                        </span>
                        {groupBy === "none" ? null : (
                            <span className="inline-flex h-8 items-center rounded-full border border-border/60 bg-card/60 px-3 font-medium text-muted-foreground text-xs">
                                {sections.length} group
                                {sections.length === 1 ? "" : "s"}
                            </span>
                        )}
                        {(hasActiveFilters || hasNonDefaultView) &&
                        !showEmptyLibraryPeek ? (
                            <Button
                                onClick={() => {
                                    clearLibraryPalette().catch(
                                        () => undefined
                                    );
                                }}
                                size="xs"
                                variant="ghost"
                            >
                                Reset browser
                            </Button>
                        ) : null}
                        {enableSectionCollapse ? (
                            <>
                                <Button
                                    onClick={expandAllSections}
                                    size="xs"
                                    variant="ghost"
                                >
                                    Expand all
                                </Button>
                                <Button
                                    onClick={collapseAllSections}
                                    size="xs"
                                    variant="ghost"
                                >
                                    Collapse all
                                </Button>
                            </>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <BrowserSelect
                            label="Source"
                            onValueChange={(value) =>
                                setSourceFilter(value as SourceFilter)
                            }
                            options={sourceOptions}
                            value={sourceFilter}
                        />
                        <BrowserSelect
                            label="Preview"
                            onValueChange={(value) =>
                                setThumbFilter(value as ThumbnailFilter)
                            }
                            options={thumbnailOptions}
                            value={thumbFilter}
                        />
                        <BrowserSelect
                            label="Caption"
                            onValueChange={(value) =>
                                setCaptionFilter(value as CaptionFilter)
                            }
                            options={captionOptions}
                            value={captionFilter}
                        />
                        <BrowserSelect
                            className="min-w-[12rem]"
                            label="Domain"
                            onValueChange={setDomainFilter}
                            options={domainOptions}
                            value={domainFilter}
                        />
                        <BrowserSelect
                            label="Sort"
                            onValueChange={(value) =>
                                setSortMode(value as SortMode)
                            }
                            options={sortOptions}
                            value={sortMode}
                        />
                        <BrowserSelect
                            label="Group"
                            onValueChange={(value) =>
                                setGroupBy(value as GroupByMode)
                            }
                            options={groupOptions}
                            value={groupBy}
                        />
                        <BrowserSelect
                            label="Columns"
                            onValueChange={(value) =>
                                setColumnCountMode(value as ColumnCountMode)
                            }
                            options={columnOptions}
                            value={columnCountMode}
                        />
                    </div>
                </div>
            </div>

            <div className="relative z-0 flex w-full flex-col gap-10">
                {libraryGridBody}
            </div>
        </div>
    );
}
