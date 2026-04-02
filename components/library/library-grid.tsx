"use client";

import { Button } from "@/components/ui/button";
import {
    ContextMenu,
    ContextMenuItem,
    ContextMenuPopup,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Masonry, MasonryItem } from "@/components/ui/masonry";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeURL } from "@/lib/url";
import { cn } from "@/lib/utils";
import type { LibraryItem } from "@/prisma/client/client";
import {
    ArrowUpRightIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    CopyIcon,
    ExternalLinkIcon,
    Trash2Icon,
} from "lucide-react";
import type {
    CSSProperties,
    ReactElement,
    MouseEvent as ReactMouseEvent,
} from "react";

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
    readonly onCopyLink?: (item: LibraryItem) => void;
    readonly onDelete?: (item: LibraryItem) => void;
    readonly onOpenHere?: (item: LibraryItem) => void;
    readonly onOpenInNewTab?: (item: LibraryItem) => void;
    readonly pendingDeleteItemId?: string | null;
}

interface SectionProps extends GridProps {
    readonly collapsed?: boolean;
    readonly collapsible?: boolean;
    readonly emptyHint: string;
    readonly onToggle?: () => void;
    readonly summaryLabel?: string;
    readonly title: string;
}

interface LibraryGridCardProps {
    readonly addedLabel: string;
    readonly alt: string;
    readonly domain: string;
    readonly hasBothDates: boolean;
    readonly href: string;
    readonly item: LibraryItem;
    readonly onCopyLink?: (item: LibraryItem) => void;
    readonly onDelete?: (item: LibraryItem) => void;
    readonly onOpenHere?: (item: LibraryItem) => void;
    readonly onOpenInNewTab?: (item: LibraryItem) => void;
    readonly pendingDeleteItemId?: string | null;
    readonly postedLabel: string;
}

function itemDomain(url: string): string {
    try {
        return new URL(url).hostname.replace(WWW_PREFIX_RE, "") || "Other";
    } catch {
        return "Other";
    }
}

function itemDateLabel(dateValue: Date | string | null | undefined): string {
    if (!dateValue) {
        return "";
    }
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
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

function LibraryGridCard({
    addedLabel,
    alt,
    domain,
    hasBothDates,
    href,
    item,
    onCopyLink,
    onDelete,
    onOpenHere,
    onOpenInNewTab,
    pendingDeleteItemId,
    postedLabel,
}: LibraryGridCardProps): ReactElement {
    const isDeletePending = pendingDeleteItemId === item.id;

    const handlePrimaryClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        onOpenInNewTab?.(item);
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger render={<div className="contents" />}>
                <a
                    className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/50 ring-1 ring-border/30 transition-[transform,border-color,box-shadow] hover:border-border hover:shadow-lg/5 focus-visible:-translate-y-0.5 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    href={href}
                    onClick={handlePrimaryClick}
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
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/78 via-black/40 to-transparent p-3 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="rounded-full bg-white/14 px-2 py-0.5 backdrop-blur-sm">
                                    {domain}
                                </span>
                                {hasBothDates ? (
                                    <>
                                        <span className="rounded-full bg-white/14 px-2 py-0.5 backdrop-blur-sm">
                                            Posted: {postedLabel}
                                        </span>
                                        <span className="rounded-full bg-white/14 px-2 py-0.5 backdrop-blur-sm">
                                            Added: {addedLabel}
                                        </span>
                                    </>
                                ) : (
                                    <span className="rounded-full bg-white/14 px-2 py-0.5 backdrop-blur-sm">
                                        {postedLabel || addedLabel}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <p className="line-clamp-2 truncate px-3 py-2 text-foreground text-xs leading-tight">
                        {item.caption?.trim() || item.url}
                    </p>
                </a>
            </ContextMenuTrigger>
            <ContextMenuPopup>
                <ContextMenuItem onClick={() => onOpenInNewTab?.(item)}>
                    <ExternalLinkIcon className="size-4 text-muted-foreground" />
                    Open in new tab
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onOpenHere?.(item)}>
                    <ArrowUpRightIcon className="size-4 text-muted-foreground" />
                    Open here
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onCopyLink?.(item)}>
                    <CopyIcon className="size-4 text-muted-foreground" />
                    Copy link
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    className="text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive"
                    disabled={isDeletePending}
                    onClick={() => onDelete?.(item)}
                >
                    <Trash2Icon className="size-4" />
                    {isDeletePending ? "Deleting..." : "Delete"}
                </ContextMenuItem>
            </ContextMenuPopup>
        </ContextMenu>
    );
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
        <Masonry columnCount={5} fallback={fallback} gap={4} linear>
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
    onCopyLink,
    onDelete,
    onOpenHere,
    onOpenInNewTab,
    pendingDeleteItemId,
}: GridProps): ReactElement | null {
    if (items.length === 0) {
        return null;
    }

    return (
        <Masonry
            columnCount={columnCount}
            deps={[layoutToken, items, pendingDeleteItemId]}
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
            gap={4}
            linear
        >
            {items.map((item) => {
                const href = normalizeURL(item.url);
                const alt = (item.caption ?? "").trim() || "Saved item";
                const domain = itemDomain(item.url);
                const addedLabel = itemDateLabel(
                    item.scrapedAt ?? item.createdAt
                );
                const postedLabel = itemDateLabel(item.postedAt);
                const hasBothDates =
                    !!postedLabel && !!addedLabel && postedLabel !== addedLabel;

                return (
                    <MasonryItem key={item.id}>
                        <LibraryGridCard
                            addedLabel={addedLabel}
                            alt={alt}
                            domain={domain}
                            hasBothDates={hasBothDates}
                            href={href}
                            item={item}
                            onCopyLink={onCopyLink}
                            onDelete={onDelete}
                            onOpenHere={onOpenHere}
                            onOpenInNewTab={onOpenInNewTab}
                            pendingDeleteItemId={pendingDeleteItemId}
                            postedLabel={postedLabel}
                        />
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
    onCopyLink,
    onDelete,
    onOpenHere,
    onOpenInNewTab,
    onToggle,
    pendingDeleteItemId,
    summaryLabel,
    title,
}: SectionProps): ReactElement {
    const canToggle = collapsible && onToggle;
    const stickyHeader = collapsible;
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
                onCopyLink={onCopyLink}
                onDelete={onDelete}
                onOpenHere={onOpenHere}
                onOpenInNewTab={onOpenInNewTab}
                pendingDeleteItemId={pendingDeleteItemId}
            />
        );
    }

    return (
        <section className="flex w-full flex-col gap-3">
            <div
                className={cn(stickyHeader && "sticky z-10")}
                style={
                    stickyHeader
                        ? ({
                              top: "var(--library-section-sticky-top)",
                          } as CSSProperties)
                        : undefined
                }
            >
                <div
                    className={cn(
                        "flex items-center justify-between gap-3",
                        stickyHeader &&
                            "rounded-2xl border border-border/70 bg-background/92 px-2 py-2 shadow-xs/5 backdrop-blur-md supports-[backdrop-filter]:bg-background/80"
                    )}
                >
                    {canToggle ? (
                        <Button
                            className="min-w-0 flex-1 justify-start rounded-xl px-3"
                            onClick={onToggle}
                            variant="ghost"
                        >
                            {collapsed ? (
                                <ChevronRightIcon className="size-4" />
                            ) : (
                                <ChevronDownIcon className="size-4" />
                            )}
                            <span className="ml-1 truncate font-medium">
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
                        <span className="font-medium text-muted-foreground text-xs tabular-nums">
                            {items.length}
                        </span>
                    </div>
                </div>
            </div>
            {body}
        </section>
    );
}
