import { Masonry, MasonryItem } from "@/components/ui/masonry";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeURL } from "@/lib/url";
import { cn } from "@/lib/utils";
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

interface SectionProps extends GridProps {
    readonly emptyHint: string;
    readonly title: string;
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
        <Masonry columnCount={5} fallback={fallback} gap={8}>
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
    items,
}: GridProps): ReactElement | null {
    if (items.length === 0) {
        return null;
    }

    return (
        <Masonry
            columnCount={5}
            fallback={
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {items.map((item) => (
                        <Skeleton key={item.id} />
                    ))}
                </div>
            }
            gap={8}
        >
            {items.map((item) => {
                const href = normalizeURL(item.url);
                const alt = (item.caption ?? "").trim() || "Saved item";

                return (
                    <MasonryItem asChild key={item.id}>
                        <a
                            className="group flex flex-col overflow-hidden rounded-lg border border-border/40 bg-card/40 ring-1 ring-border/30"
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
                    </MasonryItem>
                );
            })}
        </Masonry>
    );
}

export function ExtensionLibrarySection({
    emptyHint,
    items,
    title,
}: SectionProps): ReactElement {
    return (
        <section className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <h2 className="font-medium text-lg">{title}</h2>
                <span className="text-muted-foreground text-xs">
                    {items.length} item{items.length === 1 ? "" : "s"}
                </span>
            </div>
            {items.length === 0 ? (
                <p className="text-muted-foreground text-sm">{emptyHint}</p>
            ) : (
                <ExtensionLibraryGrid items={items} />
            )}
        </section>
    );
}
