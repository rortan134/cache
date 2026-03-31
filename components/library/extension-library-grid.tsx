import { Button } from "@/components/ui/button";
import { Masonry, MasonryItem } from "@/components/ui/masonry";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeURL } from "@/lib/url";
import { cn } from "@/lib/utils";
import type { LibraryItem } from "@/prisma/client/client";
import { LibraryItemSource } from "@/prisma/client/enums";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import type { CSSProperties, ReactElement } from "react";

/** Stable placeholders for empty-library masonry sneak peek (opacity fades by order). */
const EMPTY_LIBRARY_PEEK_PLACEHOLDERS = [
    { aspect: "aspect-[3/4]", id: "library-empty-peek-0" },
    { aspect: "aspect-[4/5]", id: "library-empty-peek-1" },
    { aspect: "aspect-square", id: "library-empty-peek-2" },
    { aspect: "aspect-[5/6]", id: "library-empty-peek-3" },
    { aspect: "aspect-[3/4]", id: "library-empty-peek-4" },
    { aspect: "aspect-square", id: "library-empty-peek-5" },
    { aspect: "aspect-[4/5]", id: "library-empty-peek-6" },
    { aspect: "aspect-[3/4]", id: "library-empty-peek-7" },
    { aspect: "aspect-[5/6]", id: "library-empty-peek-8" },
    { aspect: "aspect-[4/5]", id: "library-empty-peek-9" },
] as const;
const WWW_PREFIX_RE = /^www\./;

interface GridProps {
    readonly columnCount?: number;
    readonly items: LibraryItem[];
    readonly layoutToken?: number;
}

interface SectionProps extends GridProps {
    readonly collapsed?: boolean;
    readonly collapsible?: boolean;
    readonly emptyHint: string;
    readonly onToggle?: () => void;
    readonly summaryLabel?: string;
    readonly title: string;
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

function itemDomain(url: string): string {
    try {
        return new URL(url).hostname.replace(WWW_PREFIX_RE, "") || "Other";
    } catch {
        return "Other";
    }
}

function itemDateLabel(item: LibraryItem): string {
    const value = item.scrapedAt ?? item.createdAt;
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function fallbackGridStyle(columnCount?: number): CSSProperties | undefined {
    if (!columnCount) {
        return undefined;
    }

    return {
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
    };
}

export function ExtensionLibraryEmptyMasonryPeek(): ReactElement {
    const fallback = (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {EMPTY_LIBRARY_PEEK_PLACEHOLDERS.map(({ aspect, id }, index) => {
                const opacity = Math.max(0.06, 1 - index * 0.095);
                return (
                    <div
                        className="flex flex-col overflow-hidden rounded-xl border border-border/40 bg-card/40 ring-1 ring-border/30 transition-opacity"
                        key={id}
                        style={{ opacity }}
                    >
                        <Skeleton
                            className={cn("w-full rounded-none", aspect)}
                        />
                        <div className="flex min-h-14 flex-col gap-1.5 p-3">
                            <Skeleton className="h-2.5 w-[92%]" />
                            <Skeleton className="h-2.5 w-[72%]" />
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <Masonry columnCount={5} fallback={fallback} gap={8} linear>
            {EMPTY_LIBRARY_PEEK_PLACEHOLDERS.map(({ aspect, id }, index) => {
                const opacity = Math.max(0.06, 1 - index * 0.095);
                return (
                    <MasonryItem asChild key={id} style={{ opacity }}>
                        <div className="group flex flex-col overflow-hidden rounded-lg border border-border/40 bg-card/40 ring-1 ring-border/30">
                            <Skeleton
                                className={cn("w-full rounded-none", aspect)}
                            />
                            <div className="flex min-h-14 flex-col gap-1.5 p-3">
                                <Skeleton className="h-2.5 w-[92%]" />
                                <Skeleton className="h-2.5 w-[72%]" />
                            </div>
                        </div>
                    </MasonryItem>
                );
            })}
        </Masonry>
    );
}

export function ExtensionLibraryGrid({
    columnCount,
    items,
    layoutToken,
}: GridProps): ReactElement | null {
    if (items.length === 0) {
        return null;
    }

    return (
        <Masonry
            columnCount={columnCount}
            fallback={
                <div
                    className={cn(
                        "grid gap-2",
                        !columnCount &&
                            "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                    )}
                    style={fallbackGridStyle(columnCount)}
                >
                    {items.map((item) => (
                        <Skeleton key={item.id} />
                    ))}
                </div>
            }
            gap={8}
            key={layoutToken}
            linear
        >
            {items.map((item) => {
                const href = normalizeURL(item.url);
                const alt = (item.caption ?? "").trim() || "Saved item";
                const source = sourceLabel(item.source);
                const domain = itemDomain(item.url);
                const dateLabel = itemDateLabel(item);

                return (
                    <MasonryItem asChild key={item.id}>
                        <a
                            className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/50 ring-1 ring-border/30 transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-border hover:shadow-lg/5 focus-visible:-translate-y-0.5 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                            href={href}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <div className="relative aspect-3/4 w-full overflow-hidden bg-muted">
                                {item.thumbnailUrl ? (
                                    <img
                                        alt={alt}
                                        className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.025] group-focus-visible:scale-[1.025]"
                                        height={400}
                                        loading="lazy"
                                        src={item.thumbnailUrl}
                                        width={300}
                                    />
                                ) : (
                                    <div className="flex size-full items-center justify-center bg-linear-to-br from-muted to-muted/40 text-muted-foreground text-xs">
                                        No preview
                                    </div>
                                )}

                                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-2">
                                    <span className="rounded-full bg-black/65 px-2 py-1 font-medium text-[11px] text-white backdrop-blur-sm">
                                        {source}
                                    </span>
                                    <span className="rounded-full bg-black/65 px-2 py-1 text-[11px] text-white opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                                        Open
                                    </span>
                                </div>

                                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/78 via-black/40 to-transparent p-3 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                        <span className="rounded-full bg-white/14 px-2 py-0.5 backdrop-blur-sm">
                                            {domain}
                                        </span>
                                        <span className="rounded-full bg-white/14 px-2 py-0.5 backdrop-blur-sm">
                                            {dateLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex min-h-20 flex-col gap-2 p-3">
                                <p className="line-clamp-2 text-foreground text-sm leading-snug">
                                    {item.caption?.trim() || item.url}
                                </p>
                                <div className="flex items-center justify-between gap-2 text-muted-foreground text-xs">
                                    <span className="min-w-0 truncate">
                                        {domain}
                                    </span>
                                    <span className="shrink-0 tabular-nums">
                                        {dateLabel}
                                    </span>
                                </div>
                            </div>
                        </a>
                    </MasonryItem>
                );
            })}
        </Masonry>
    );
}

export function ExtensionLibrarySection({
    collapsed = false,
    collapsible = false,
    columnCount,
    emptyHint,
    items,
    layoutToken,
    onToggle,
    summaryLabel,
    title,
}: SectionProps): ReactElement {
    const canToggle = collapsible && onToggle;
    const countLabel = `${items.length} item${items.length === 1 ? "" : "s"}`;
    let body: ReactElement | null;

    if (collapsed) {
        body = null;
    } else if (items.length === 0) {
        body = <p className="text-muted-foreground text-sm">{emptyHint}</p>;
    } else {
        body = (
            <ExtensionLibraryGrid
                columnCount={columnCount}
                items={items}
                layoutToken={layoutToken}
            />
        );
    }

    return (
        <section className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                {canToggle ? (
                    <Button
                        className="min-w-0 flex-1 justify-start rounded-xl px-3"
                        onClick={onToggle}
                        size="sm"
                        variant="ghost"
                    >
                        {collapsed ? (
                            <ChevronRightIcon className="size-4" />
                        ) : (
                            <ChevronDownIcon className="size-4" />
                        )}
                        <span className="truncate font-medium text-base sm:text-sm">
                            {title}
                        </span>
                    </Button>
                ) : (
                    <h2 className="font-medium text-lg">{title}</h2>
                )}
                <div className="flex items-center gap-2">
                    {summaryLabel ? (
                        <span className="rounded-full bg-card/60 px-2 py-1 text-muted-foreground text-xs">
                            {summaryLabel}
                        </span>
                    ) : null}
                    <span className="text-muted-foreground text-xs">
                        {countLabel}
                    </span>
                </div>
            </div>
            {body}
        </section>
    );
}
