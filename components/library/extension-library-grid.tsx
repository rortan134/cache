import { Masonry, MasonryItem } from "@/components/ui/masonry";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { normalizeURL } from "@/lib/url";
import type { LibraryItem } from "@/prisma/client/client";
import type { ReactElement } from "react";

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

interface GridProps {
    readonly items: LibraryItem[];
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
        <Masonry columnCount={4} fallback={fallback} gap={10}>
            {EMPTY_LIBRARY_PEEK_PLACEHOLDERS.map(({ aspect, id }, index) => {
                const opacity = Math.max(0.06, 1 - index * 0.095);
                return (
                    <MasonryItem
                        className="transition-opacity"
                        key={id}
                        style={{ opacity }}
                    >
                        <div className="flex flex-col overflow-hidden rounded-xl border border-border/40 bg-card/40 ring-1 ring-border/30">
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
    items,
}: GridProps): ReactElement | null {
    if (items.length === 0) {
        return null;
    }

    return (
        <Masonry
            columnCount={4}
            fallback={
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {items.map((item) => (
                        <Skeleton key={item.id} />
                    ))}
                </div>
            }
            gap={10}
        >
            {items.map((item) => {
                const href = normalizeURL(item.url);
                const alt = (item.caption ?? "").trim() || "Saved item";

                return (
                    <MasonryItem asChild key={item.id}>
                        <li>
                            <a
                                className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card ring-1 ring-border/40 transition hover:border-border hover:ring-border/80"
                                href={href}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                <div className="relative aspect-3/4 w-full overflow-hidden bg-muted">
                                    {item.thumbnailUrl ? (
                                        <img
                                            alt={alt}
                                            className="size-full object-cover transition group-hover:scale-[1.02]"
                                            height={400}
                                            loading="lazy"
                                            src={item.thumbnailUrl}
                                            width={300}
                                        />
                                    ) : (
                                        <div className="flex size-full items-center justify-center text-muted-foreground text-xs">
                                            No preview
                                        </div>
                                    )}
                                </div>
                                <div className="flex min-h-14 flex-col gap-1 p-3">
                                    <p className="line-clamp-2 text-foreground text-xs leading-snug">
                                        {item.caption?.trim() || item.url}
                                    </p>
                                </div>
                            </a>
                        </li>
                    </MasonryItem>
                );
            })}
        </Masonry>
    );
}
