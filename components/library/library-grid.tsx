"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ContextMenu,
    ContextMenuItem,
    ContextMenuPopup,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Masonry, MasonryItem } from "@/components/ui/masonry";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { getSubtleColorGradientFromName } from "@/lib/colors";
import type {
    LibraryCollectionSummary,
    LibraryItemWithCollections,
} from "@/lib/library/types";
import { normalizeURL } from "@/lib/url";
import { cn } from "@/lib/utils";
import {
    ArrowUpRightIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    CopyIcon,
    ExternalLinkIcon,
    Layers3Icon,
    PlusIcon,
    Trash2Icon,
} from "lucide-react";
import type {
    CSSProperties,
    ReactElement,
    MouseEvent as ReactMouseEvent,
} from "react";
import { useMemo, useState } from "react";

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
    readonly collections: readonly LibraryCollectionSummary[];
    readonly columnCount?: number;
    readonly items: LibraryItemWithCollections[];
    readonly layoutToken?: number;
    readonly onCopyLink?: (item: LibraryItemWithCollections) => void;
    readonly onCreateCollectionRequest: (itemId?: string) => void;
    readonly onDelete?: (item: LibraryItemWithCollections) => void;
    readonly onOpenHere?: (item: LibraryItemWithCollections) => void;
    readonly onOpenInNewTab?: (item: LibraryItemWithCollections) => void;
    readonly onUpdateItemCollections: (
        itemId: string,
        collectionIds: string[]
    ) => void;
    readonly pendingCollectionItemIds: readonly string[];
    readonly pendingDeleteItemId?: string | null;
}

interface SectionProps extends GridProps {
    readonly accentKey?: string;
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
    readonly collections: readonly LibraryCollectionSummary[];
    readonly domain: string;
    readonly hasBothDates: boolean;
    readonly href: string;
    readonly item: LibraryItemWithCollections;
    readonly onCopyLink?: (item: LibraryItemWithCollections) => void;
    readonly onCreateCollectionRequest: (itemId?: string) => void;
    readonly onDelete?: (item: LibraryItemWithCollections) => void;
    readonly onOpenHere?: (item: LibraryItemWithCollections) => void;
    readonly onOpenInNewTab?: (item: LibraryItemWithCollections) => void;
    readonly onUpdateItemCollections: (
        itemId: string,
        collectionIds: string[]
    ) => void;
    readonly pendingCollectionItemIds: readonly string[];
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

function LibraryCollectionPicker({
    collections,
    item,
    onCreateCollectionRequest,
    onUpdateItemCollections,
    pendingCollectionItemIds,
}: {
    readonly collections: readonly LibraryCollectionSummary[];
    readonly item: LibraryItemWithCollections;
    readonly onCreateCollectionRequest: (itemId?: string) => void;
    readonly onUpdateItemCollections: (
        itemId: string,
        collectionIds: string[]
    ) => void;
    readonly pendingCollectionItemIds: readonly string[];
}): ReactElement {
    const [open, setOpen] = useState(false);
    const selectedCollectionIds = useMemo(
        () => item.collections.map((collection) => collection.id),
        [item.collections]
    );
    const isPending = pendingCollectionItemIds.includes(item.id);
    const selectedCount = selectedCollectionIds.length;

    return (
        <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger
                render={
                    <Button
                        aria-label={
                            selectedCount > 0
                                ? `Edit collections (${selectedCount} selected)`
                                : "Add to collections"
                        }
                        className={cn(
                            "rounded-full border-border/60 bg-background/88 shadow-sm backdrop-blur-sm",
                            selectedCount > 0 &&
                                "border-primary/30 bg-primary/10 text-primary"
                        )}
                        loading={isPending}
                        size="icon-xs"
                        variant="outline"
                    />
                }
            >
                {!isPending && (
                    <>
                        <Layers3Icon className="size-3.5" />
                        {selectedCount > 0 ? (
                            <Badge
                                className="-mr-0.5 min-w-4.5 rounded-full px-1 text-[10px]"
                                size="sm"
                            >
                                {selectedCount}
                            </Badge>
                        ) : null}
                    </>
                )}
            </PopoverTrigger>
            <PopoverPopup
                align="end"
                className="w-[18rem] rounded-2xl [--viewport-inline-padding:0px]"
                sideOffset={8}
            >
                <div className="flex max-h-88 min-h-0 flex-col">
                    <div className="border-border/70 border-b px-4 py-3">
                        <p className="font-medium text-sm">Collections</p>
                        <p className="mt-1 text-muted-foreground text-xs">
                            Tag this item into one or more groups.
                        </p>
                    </div>
                    {collections.length > 0 ? (
                        <div className="min-h-0 flex-1 overflow-y-auto p-2">
                            {collections.map((collection) => {
                                const isSelected =
                                    selectedCollectionIds.includes(
                                        collection.id
                                    );
                                return (
                                    <button
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent/70 focus-visible:bg-accent/70 focus-visible:outline-none",
                                            isSelected && "bg-accent/50"
                                        )}
                                        disabled={isPending}
                                        key={collection.id}
                                        onClick={() => {
                                            const nextIds = isSelected
                                                ? selectedCollectionIds.filter(
                                                      (id) =>
                                                          id !== collection.id
                                                  )
                                                : [
                                                      ...selectedCollectionIds,
                                                      collection.id,
                                                  ];
                                            onUpdateItemCollections(
                                                item.id,
                                                nextIds
                                            );
                                        }}
                                        type="button"
                                    >
                                        <span
                                            className={cn(
                                                "flex size-5 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background text-primary transition-colors",
                                                isSelected &&
                                                    "border-primary/40 bg-primary/12"
                                            )}
                                        >
                                            {isSelected ? (
                                                <CheckIcon className="size-3.5" />
                                            ) : null}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-medium text-sm">
                                                {collection.name}
                                            </span>
                                            <span className="block text-muted-foreground text-xs">
                                                {collection.itemCount} item
                                                {collection.itemCount === 1
                                                    ? ""
                                                    : "s"}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex min-h-24 flex-1 items-center justify-center px-4 text-center text-muted-foreground text-sm">
                            No collections yet. Create one to start grouping
                            saved items.
                        </div>
                    )}
                    <div className="border-border/70 border-t bg-background/96 p-2 backdrop-blur-sm">
                        <Button
                            className="w-full justify-start rounded-xl"
                            onClick={() => {
                                setOpen(false);
                                onCreateCollectionRequest(item.id);
                            }}
                            size="sm"
                            variant="ghost"
                        >
                            <PlusIcon className="size-4" />
                            Create new collection
                        </Button>
                    </div>
                </div>
            </PopoverPopup>
        </Popover>
    );
}

function LibraryGridCard({
    addedLabel,
    alt,
    collections,
    domain,
    hasBothDates,
    href,
    item,
    onCopyLink,
    onCreateCollectionRequest,
    onDelete,
    onOpenHere,
    onOpenInNewTab,
    onUpdateItemCollections,
    pendingCollectionItemIds,
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
                <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/50 ring-1 ring-border/30 transition-[transform,border-color,box-shadow] hover:border-border hover:shadow-lg/5">
                    <div className="absolute top-2 right-2 z-10">
                        <LibraryCollectionPicker
                            collections={collections}
                            item={item}
                            onCreateCollectionRequest={
                                onCreateCollectionRequest
                            }
                            onUpdateItemCollections={onUpdateItemCollections}
                            pendingCollectionItemIds={pendingCollectionItemIds}
                        />
                    </div>
                    <a
                        className="flex flex-col focus-visible:-translate-y-0.5 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
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
                        <div className="flex flex-col gap-2 px-3 py-2">
                            <p className="line-clamp-2 truncate text-foreground text-xs leading-tight">
                                {item.caption?.trim() || item.url}
                            </p>
                            {item.collections.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {item.collections
                                        .slice(0, 2)
                                        .map((collection) => (
                                            <span
                                                className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
                                                key={collection.id}
                                            >
                                                {collection.name}
                                            </span>
                                        ))}
                                    {item.collections.length > 2 ? (
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                            +{item.collections.length - 2}
                                        </span>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </a>
                </div>
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
    collections,
    columnCount,
    items,
    layoutToken,
    onCopyLink,
    onCreateCollectionRequest,
    onDelete,
    onOpenHere,
    onOpenInNewTab,
    onUpdateItemCollections,
    pendingCollectionItemIds,
    pendingDeleteItemId,
}: GridProps): ReactElement | null {
    if (items.length === 0) {
        return null;
    }

    return (
        <Masonry
            columnCount={columnCount}
            deps={[
                collections,
                layoutToken,
                items,
                pendingCollectionItemIds,
                pendingDeleteItemId,
            ]}
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
                            collections={collections}
                            domain={domain}
                            hasBothDates={hasBothDates}
                            href={href}
                            item={item}
                            onCopyLink={onCopyLink}
                            onCreateCollectionRequest={
                                onCreateCollectionRequest
                            }
                            onDelete={onDelete}
                            onOpenHere={onOpenHere}
                            onOpenInNewTab={onOpenInNewTab}
                            onUpdateItemCollections={onUpdateItemCollections}
                            pendingCollectionItemIds={pendingCollectionItemIds}
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
    accentKey,
    collapsed = false,
    collapsible = false,
    collections,
    columnCount,
    emptyHint,
    items,
    layoutToken,
    onCopyLink,
    onCreateCollectionRequest,
    onDelete,
    onOpenHere,
    onOpenInNewTab,
    onUpdateItemCollections,
    onToggle,
    pendingCollectionItemIds,
    pendingDeleteItemId,
    summaryLabel,
    title,
}: SectionProps): ReactElement {
    const canToggle = collapsible && onToggle;
    const stickyHeader = collapsible;
    const headerGradient = stickyHeader
        ? getSubtleColorGradientFromName(accentKey ?? title)
        : undefined;
    let body: ReactElement | null;

    if (collapsed) {
        body = null;
    } else if (items.length === 0) {
        body = <p className="text-muted-foreground text-sm">{emptyHint}</p>;
    } else {
        body = (
            <ExtensionLibraryGrid
                collections={collections}
                columnCount={columnCount}
                items={items}
                layoutToken={layoutToken}
                onCopyLink={onCopyLink}
                onCreateCollectionRequest={onCreateCollectionRequest}
                onDelete={onDelete}
                onOpenHere={onOpenHere}
                onOpenInNewTab={onOpenInNewTab}
                onUpdateItemCollections={onUpdateItemCollections}
                pendingCollectionItemIds={pendingCollectionItemIds}
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
                            "rounded-xl bg-background/92 backdrop-blur-md supports-backdrop-filter:bg-background/80"
                    )}
                    style={
                        stickyHeader
                            ? ({
                                  background: headerGradient,
                              } as CSSProperties)
                            : undefined
                    }
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
