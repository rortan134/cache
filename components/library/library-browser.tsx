"use client";

import { ExtensionLibraryGrid } from "@/components/library/extension-library-grid";
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
import type { LibraryItem } from "@/prisma/client/client";
import { LibraryItemSource } from "@/prisma/client/enums";
import { useMemo, useState } from "react";

type GroupByMode = "none" | "source" | "domain" | "month";

type SourceFilter = "all" | LibraryItemSource;

type ThumbnailFilter = "any" | "with" | "without";

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

interface Props {
    readonly items: LibraryItem[];
}

export function LibraryBrowser({ items }: Props) {
    const [searchQuery, setSearchQuery] = useSearchQuery();
    const [paletteInput, setPaletteInput] = useState("");
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
    const [thumbFilter, setThumbFilter] = useState<ThumbnailFilter>("any");
    const [groupBy, setGroupBy] = useState<GroupByMode>("none");

    const { commandItemGroups, filterItems, groupItems, searchItems } =
        useMemo(() => {
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

            const nextFilterItems: CommandPaletteItem[] = [
                {
                    label: "Filter by: All sources",
                    onSelect: () => setSourceFilter("all"),
                    value: "filter by all sources",
                },
                {
                    label: "Filter by: Instagram",
                    onSelect: () =>
                        setSourceFilter(LibraryItemSource.instagram),
                    value: "filter by instagram source",
                },
                {
                    label: "Filter by: TikTok",
                    onSelect: () => setSourceFilter(LibraryItemSource.tiktok),
                    value: "filter by tiktok source",
                },
                {
                    label: "Filter by: Other",
                    onSelect: () => setSourceFilter(LibraryItemSource.other),
                    value: "filter by other source",
                },
                {
                    label: "Filter by: Any preview",
                    onSelect: () => setThumbFilter("any"),
                    value: "filter preview any thumbnail",
                },
                {
                    label: "Filter by: With preview",
                    onSelect: () => setThumbFilter("with"),
                    value: "filter preview with thumbnail",
                },
                {
                    label: "Filter by: Without preview",
                    onSelect: () => setThumbFilter("without"),
                    value: "filter preview without thumbnail",
                },
            ];

            const nextGroupItems: CommandPaletteItem[] = [
                {
                    label: "Group by: None",
                    onSelect: () => setGroupBy("none"),
                    value: "group by none flat list",
                },
                {
                    label: "Group by: Source",
                    onSelect: () => setGroupBy("source"),
                    value: "group by source integration",
                },
                {
                    label: "Group by: Domain",
                    onSelect: () => setGroupBy("domain"),
                    value: "group by domain hostname",
                },
                {
                    label: "Group by: Month",
                    onSelect: () => setGroupBy("month"),
                    value: "group by month scraped",
                },
            ];

            return {
                commandItemGroups: [
                    { items: nextSearchItems },
                    { items: nextFilterItems },
                    { items: nextGroupItems },
                ],
                filterItems: nextFilterItems,
                groupItems: nextGroupItems,
                searchItems: nextSearchItems,
            };
        }, [paletteInput, searchQuery, setSearchQuery]);

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

    return (
        <div className="flex w-full flex-col gap-8">
            <CommandPanel className="w-full max-w-xl">
                <Command
                    items={commandItemGroups}
                    onValueChange={setPaletteInput}
                    value={paletteInput}
                >
                    <CommandInput placeholder="Search or run a command…" />
                    <CommandEmpty>No matching commands.</CommandEmpty>
                    <CommandList>
                        {searchItems.length > 0 ? (
                            <CommandGroup items={searchItems}>
                                <CommandGroupLabel>Search</CommandGroupLabel>
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
                        <CommandGroup items={filterItems}>
                            <CommandGroupLabel>Filter by…</CommandGroupLabel>
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
                        <CommandGroup items={groupItems}>
                            <CommandGroupLabel>Group by…</CommandGroupLabel>
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
                    </CommandList>
                </Command>
            </CommandPanel>

            <div className="flex w-full flex-col gap-10">
                {sections.map((section) => (
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
                ))}
            </div>
        </div>
    );
}
