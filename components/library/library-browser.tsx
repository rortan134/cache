"use client";

import {
    ExtensionLibraryEmptyMasonryPeek,
    ExtensionLibraryGrid,
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
} from "@/components/ui/command";
import { useSearchQuery } from "@/hooks/use-search-query";
import { cn } from "@/lib/utils";
import type { LibraryItem } from "@/prisma/client/client";
import { LibraryItemSource } from "@/prisma/client/enums";
import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

/** Base UI combobox close reason when an item is activated (inline mode still emits this). */
const COMBOBOX_ITEM_PRESS_REASON = "item-press";

type GroupByMode = "none" | "source" | "domain" | "month";

type SourceFilter = "all" | LibraryItemSource;

type ThumbnailFilter = "any" | "with" | "without";

type PaletteSection = "search" | "filter" | "group";

interface CommandPaletteItem {
    readonly label: string;
    readonly onSelect: () => void | Promise<void>;
    readonly value: string;
}

function itemDomain(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return "Other";
    }
}

function itemMonthKey(item: LibraryItem): string {
    const d = item.scrapedAt ?? item.createdAt;
    const date = d instanceof Date ? d : new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}

function formatGroupHeading(mode: GroupByMode, key: string): string {
    if (mode === "source") {
        if (key === LibraryItemSource.google_photos) {
            return "Google Photos";
        }
        if (key === LibraryItemSource.instagram) {
            return "Instagram";
        }
        if (key === LibraryItemSource.tiktok) {
            return "TikTok";
        }
        if (key === LibraryItemSource.other) {
            return "Other";
        }
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

function PaletteChip({
    label,
    onRemove,
}: {
    readonly label: string;
    readonly onRemove: () => void;
}) {
    return (
        <span className="inline-flex max-w-[min(100%,11rem)] items-center gap-0.5 rounded-md border border-border/60 bg-background/90 py-0.5 ps-2 pe-0.5 font-medium text-foreground text-xs shadow-xs/5 dark:bg-background/40">
            <span className="min-w-0 truncate">{label}</span>
            <button
                aria-label={`Remove ${label}`}
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition hover:bg-muted/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove();
                }}
                type="button"
            >
                <XIcon className="size-3.5 shrink-0 opacity-80" />
            </button>
        </span>
    );
}

function sourceFilterChipLabel(source: SourceFilter): string | null {
    if (source === "all") {
        return null;
    }
    if (source === LibraryItemSource.instagram) {
        return "Instagram";
    }
    if (source === LibraryItemSource.google_photos) {
        return "Google Photos";
    }
    if (source === LibraryItemSource.tiktok) {
        return "TikTok";
    }
    return "Other";
}

function groupByChipLabel(mode: GroupByMode): string | null {
    if (mode === "none") {
        return null;
    }
    if (mode === "source") {
        return "Source";
    }
    if (mode === "domain") {
        return "Domain";
    }
    return "Month";
}

function LibraryPaletteTrailing({
    clearLibraryPalette,
    groupBy,
    paletteInput,
    searchQuery,
    setGroupBy,
    setSearchQuery,
    setSourceFilter,
    setThumbFilter,
    sourceFilter,
    thumbFilter,
}: {
    readonly clearLibraryPalette: () => Promise<void>;
    readonly groupBy: GroupByMode;
    readonly paletteInput: string;
    readonly searchQuery: string;
    readonly setGroupBy: (value: GroupByMode) => void;
    readonly setSearchQuery: (value: null) => Promise<unknown>;
    readonly setSourceFilter: (value: SourceFilter) => void;
    readonly setThumbFilter: (value: ThumbnailFilter) => void;
    readonly sourceFilter: SourceFilter;
    readonly thumbFilter: ThumbnailFilter;
}) {
    const chips: ReactNode[] = [];
    const q = searchQuery.trim();
    if (q) {
        const short = q.length > 22 ? `${q.slice(0, 22)}…` : q;
        chips.push(
            <PaletteChip
                key="search"
                label={`Search: ${short}`}
                onRemove={() => {
                    setSearchQuery(null).catch(() => undefined);
                }}
            />
        );
    }
    const sourceLabel = sourceFilterChipLabel(sourceFilter);
    if (sourceLabel) {
        chips.push(
            <PaletteChip
                key="source"
                label={`Source: ${sourceLabel}`}
                onRemove={() => setSourceFilter("all")}
            />
        );
    }
    if (thumbFilter === "with") {
        chips.push(
            <PaletteChip
                key="thumb"
                label="With preview"
                onRemove={() => setThumbFilter("any")}
            />
        );
    } else if (thumbFilter === "without") {
        chips.push(
            <PaletteChip
                key="thumb"
                label="Without preview"
                onRemove={() => setThumbFilter("any")}
            />
        );
    }
    const groupLabel = groupByChipLabel(groupBy);
    if (groupLabel) {
        chips.push(
            <PaletteChip
                key="group"
                label={`Group: ${groupLabel}`}
                onRemove={() => setGroupBy("none")}
            />
        );
    }

    const canReset = chips.length > 0 || paletteInput.trim().length > 0;

    return (
        <>
            {chips}
            {canReset ? (
                <Button
                    aria-label="Clear search, filters, grouping, and command input"
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
    const [groupBy, setGroupBy] = useState<GroupByMode>("none");
    const [paletteSection, setPaletteSection] =
        useState<PaletteSection>("search");
    const [commandListOpen, setCommandListOpen] = useState(false);
    const commandPanelContainerRef = useRef<HTMLDivElement>(null);
    /** Skips one combobox-driven close right after entering filter/group drill-down. */
    const suppressNextCommandCloseRef = useRef(false);

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
        (event: React.PointerEvent<HTMLDivElement>) => {
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

    const handlePaletteInputChange = useCallback((next: string) => {
        setPaletteInput(next);
        setCommandListOpen(true);
    }, []);

    const clearLibraryPalette = useCallback(async () => {
        setPaletteInput("");
        setSourceFilter("all");
        setThumbFilter("any");
        setGroupBy("none");
        setPaletteSection("search");
        await setSearchQuery(null);
        setCommandListOpen(false);
    }, [setSearchQuery]);

    const {
        commandItemGroups,
        filterPaletteItems,
        groupPaletteItems,
        modeNavItems,
        searchItems,
    } = useMemo(() => {
        const draft = paletteInput.trim();

        const nextSearchItems: CommandPaletteItem[] = [];
        if (draft) {
            nextSearchItems.push({
                label: `Search for "${draft}"`,
                onSelect: async () => {
                    await setSearchQuery(draft || null);
                    setPaletteInput("");
                },
                value: `search apply for ${draft} query`,
            });
        }
        if (searchQuery) {
            nextSearchItems.push({
                label: "Clear search",
                onSelect: async () => {
                    await setSearchQuery(null);
                },
                value: "search clear url committed",
            });
        }

        const leaveDrillDownAfterApply = () => {
            setPaletteSection("search");
            setPaletteInput("");
        };

        const nextFilterItems: CommandPaletteItem[] = [
            {
                label: "Filter by: All sources",
                onSelect: () => {
                    setSourceFilter("all");
                    leaveDrillDownAfterApply();
                },
                value: "filter by all sources",
            },
            {
                label: "Filter by: Google Photos",
                onSelect: () => {
                    setSourceFilter(LibraryItemSource.google_photos);
                    leaveDrillDownAfterApply();
                },
                value: "filter by google photos source",
            },
            {
                label: "Filter by: Instagram",
                onSelect: () => {
                    setSourceFilter(LibraryItemSource.instagram);
                    leaveDrillDownAfterApply();
                },
                value: "filter by instagram source",
            },
            {
                label: "Filter by: TikTok",
                onSelect: () => {
                    setSourceFilter(LibraryItemSource.tiktok);
                    leaveDrillDownAfterApply();
                },
                value: "filter by tiktok source",
            },
            {
                label: "Filter by: Other",
                onSelect: () => {
                    setSourceFilter(LibraryItemSource.other);
                    leaveDrillDownAfterApply();
                },
                value: "filter by other source",
            },
            {
                label: "Filter by: Any preview",
                onSelect: () => {
                    setThumbFilter("any");
                    leaveDrillDownAfterApply();
                },
                value: "filter preview any thumbnail",
            },
            {
                label: "Filter by: With preview",
                onSelect: () => {
                    setThumbFilter("with");
                    leaveDrillDownAfterApply();
                },
                value: "filter preview with thumbnail",
            },
            {
                label: "Filter by: Without preview",
                onSelect: () => {
                    setThumbFilter("without");
                    leaveDrillDownAfterApply();
                },
                value: "filter preview without thumbnail",
            },
        ];

        const nextGroupItems: CommandPaletteItem[] = [
            {
                label: "Group by: None",
                onSelect: () => {
                    setGroupBy("none");
                    leaveDrillDownAfterApply();
                },
                value: "group by none flat list",
            },
            {
                label: "Group by: Source",
                onSelect: () => {
                    setGroupBy("source");
                    leaveDrillDownAfterApply();
                },
                value: "group by source integration",
            },
            {
                label: "Group by: Domain",
                onSelect: () => {
                    setGroupBy("domain");
                    leaveDrillDownAfterApply();
                },
                value: "group by domain hostname",
            },
            {
                label: "Group by: Month",
                onSelect: () => {
                    setGroupBy("month");
                    leaveDrillDownAfterApply();
                },
                value: "group by month scraped",
            },
        ];

        const backToSearchItem: CommandPaletteItem = {
            label: "Back",
            onSelect: () => {
                setPaletteSection("search");
                setPaletteInput("");
            },
            value: "back navigate return to search mode",
        };

        const nextModeNavItems: CommandPaletteItem[] = [
            {
                label: "Filter by…",
                onSelect: () => {
                    suppressNextCommandCloseRef.current = true;
                    setPaletteSection("filter");
                    setPaletteInput("");
                    queueMicrotask(() => {
                        setCommandListOpen(true);
                    });
                },
                value: "mode open filter options refine library",
            },
            {
                label: "Group by…",
                onSelect: () => {
                    suppressNextCommandCloseRef.current = true;
                    setPaletteSection("group");
                    setPaletteInput("");
                    queueMicrotask(() => {
                        setCommandListOpen(true);
                    });
                },
                value: "mode open group options organize library",
            },
        ];

        const filterPaletteItemsWithBack: CommandPaletteItem[] = [
            backToSearchItem,
            ...nextFilterItems,
        ];
        const groupPaletteItemsWithBack: CommandPaletteItem[] = [
            backToSearchItem,
            ...nextGroupItems,
        ];

        if (paletteSection === "search") {
            const groups =
                nextSearchItems.length > 0
                    ? [{ items: nextSearchItems }, { items: nextModeNavItems }]
                    : [{ items: nextModeNavItems }];
            return {
                commandItemGroups: groups,
                filterPaletteItems: filterPaletteItemsWithBack,
                groupPaletteItems: groupPaletteItemsWithBack,
                modeNavItems: nextModeNavItems,
                searchItems: nextSearchItems,
            };
        }

        if (paletteSection === "filter") {
            return {
                commandItemGroups: [{ items: filterPaletteItemsWithBack }],
                filterPaletteItems: filterPaletteItemsWithBack,
                groupPaletteItems: groupPaletteItemsWithBack,
                modeNavItems: nextModeNavItems,
                searchItems: nextSearchItems,
            };
        }

        return {
            commandItemGroups: [{ items: groupPaletteItemsWithBack }],
            filterPaletteItems: filterPaletteItemsWithBack,
            groupPaletteItems: groupPaletteItemsWithBack,
            modeNavItems: nextModeNavItems,
            searchItems: nextSearchItems,
        };
    }, [paletteInput, paletteSection, searchQuery, setSearchQuery]);

    let inputPlaceholder = "Group…";
    if (paletteSection === "search") {
        inputPlaceholder = "Type to search or filter…";
    } else if (paletteSection === "filter") {
        inputPlaceholder = "Filter…";
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
        return list;
    }, [items, searchQuery, sourceFilter, thumbFilter]);

    const sections = useMemo(() => {
        if (groupBy === "none") {
            return [{ items: filteredItems, title: null as string | null }];
        }
        const map = new Map<string, LibraryItem[]>();
        for (const item of filteredItems) {
            let key: string;
            switch (groupBy) {
                case "source":
                    key = item.source;
                    break;
                case "domain":
                    key = itemDomain(item.url);
                    break;
                case "month":
                    key = itemMonthKey(item);
                    break;
                default:
                    key = "Other";
            }
            const bucket = map.get(key) ?? [];
            bucket.push(item);
            map.set(key, bucket);
        }
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, sectionItems]) => ({
                items: sectionItems,
                title: formatGroupHeading(groupBy, key),
            }));
    }, [filteredItems, groupBy]);

    const hasActiveFilters = useMemo(
        () =>
            searchQuery.trim() !== "" ||
            sourceFilter !== "all" ||
            thumbFilter !== "any",
        [searchQuery, sourceFilter, thumbFilter]
    );

    const showEmptyLibraryPeek =
        items.length === 0 && filteredItems.length === 0 && !hasActiveFilters;

    const showNoFilteredResults =
        filteredItems.length === 0 && !showEmptyLibraryPeek;

    let libraryGridBody: ReactNode;
    if (showEmptyLibraryPeek) {
        libraryGridBody = <ExtensionLibraryEmptyMasonryPeek />;
    } else if (showNoFilteredResults) {
        libraryGridBody = (
            <p className="py-16 text-center text-muted-foreground text-sm">
                No results found.
            </p>
        );
    } else {
        libraryGridBody = sections.map((section) => (
            <div
                className="flex w-full flex-col gap-3"
                key={section.title ?? "all"}
            >
                {section.title ? (
                    <h2 className="font-medium text-foreground text-sm">
                        {section.title}
                    </h2>
                ) : null}
                <ExtensionLibraryGrid items={section.items} />
            </div>
        ));
    }

    return (
        <div className="flex w-full flex-col gap-8">
            <div
                className="relative z-10 w-full max-w-md"
                onPointerDownCapture={handlePaletteShellPointerDownCapture}
                ref={commandPanelContainerRef}
            >
                <CommandPanel className="w-full" unstyled>
                    <Command
                        items={commandItemGroups}
                        onOpenChange={handleCommandOpenChange}
                        onValueChange={handlePaletteInputChange}
                        open={commandListOpen}
                        value={paletteInput}
                    >
                        <CommandInput
                            autoFocus={false}
                            className="rounded-none border-0 bg-transparent! shadow-none outline-none ring-0 before:hidden has-focus-visible:border-transparent has-focus-visible:ring-0 has-focus-visible:ring-offset-0"
                            placeholder={inputPlaceholder}
                            trailing={
                                <LibraryPaletteTrailing
                                    clearLibraryPalette={clearLibraryPalette}
                                    groupBy={groupBy}
                                    paletteInput={paletteInput}
                                    searchQuery={searchQuery}
                                    setGroupBy={setGroupBy}
                                    setSearchQuery={setSearchQuery}
                                    setSourceFilter={setSourceFilter}
                                    setThumbFilter={setThumbFilter}
                                    sourceFilter={sourceFilter}
                                    thumbFilter={thumbFilter}
                                />
                            }
                            wrapperClassName="min-h-10 w-full max-w-md rounded-full bg-muted px-2 py-1.5 ring-1 ring-border/40 dark:ring-border/50"
                        />
                        <div
                            className={cn(
                                !commandListOpen && "hidden",
                                "absolute top-full left-0 z-50 mt-2 max-h-[min(23rem,70vh)] w-full overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-md"
                            )}
                        >
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandList>
                                {paletteSection === "search" ? (
                                    <>
                                        {searchItems.length > 0 ? (
                                            <CommandGroup items={searchItems}>
                                                <CommandGroupLabel>
                                                    Search
                                                </CommandGroupLabel>
                                                <CommandCollection>
                                                    {(
                                                        item: CommandPaletteItem
                                                    ) => (
                                                        <CommandItem
                                                            key={item.value}
                                                            onClick={
                                                                item.onSelect
                                                            }
                                                            value={item.value}
                                                        >
                                                            {item.label}
                                                        </CommandItem>
                                                    )}
                                                </CommandCollection>
                                            </CommandGroup>
                                        ) : null}
                                        <CommandGroup items={modeNavItems}>
                                            <CommandGroupLabel>
                                                Refine library
                                            </CommandGroupLabel>
                                            <CommandCollection>
                                                {(item: CommandPaletteItem) => (
                                                    <CommandItem
                                                        key={item.value}
                                                        onClick={item.onSelect}
                                                        value={item.value}
                                                    >
                                                        {item.label}
                                                    </CommandItem>
                                                )}
                                            </CommandCollection>
                                        </CommandGroup>
                                    </>
                                ) : null}
                                {paletteSection === "filter" ? (
                                    <CommandGroup items={filterPaletteItems}>
                                        <CommandGroupLabel>
                                            Filter by…
                                        </CommandGroupLabel>
                                        <CommandCollection>
                                            {(item: CommandPaletteItem) => (
                                                <CommandItem
                                                    key={item.value}
                                                    onClick={item.onSelect}
                                                    value={item.value}
                                                >
                                                    {item.label}
                                                </CommandItem>
                                            )}
                                        </CommandCollection>
                                    </CommandGroup>
                                ) : null}
                                {paletteSection === "group" ? (
                                    <CommandGroup items={groupPaletteItems}>
                                        <CommandGroupLabel>
                                            Group by…
                                        </CommandGroupLabel>
                                        <CommandCollection>
                                            {(item: CommandPaletteItem) => (
                                                <CommandItem
                                                    key={item.value}
                                                    onClick={item.onSelect}
                                                    value={item.value}
                                                >
                                                    {item.label}
                                                </CommandItem>
                                            )}
                                        </CommandCollection>
                                    </CommandGroup>
                                ) : null}
                            </CommandList>
                        </div>
                    </Command>
                </CommandPanel>
            </div>
            <div className="relative z-0 flex w-full flex-col gap-10">
                {libraryGridBody}
            </div>
        </div>
    );
}
