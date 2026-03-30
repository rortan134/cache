import { Masonry, MasonryItem } from "@/components/ui/masonry";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeURL } from "@/lib/url";
import type { LibraryItem } from "@/prisma/client/client";

interface Props {
    readonly items: LibraryItem[];
}

export function ExtensionLibraryGrid({ items }: Props) {
    const skeletonIds = Array.from(
        { length: 6 },
        () => `skeleton-${Math.random().toString(36).slice(2, 9)}`
    );

    return (
        <Masonry
            columnCount={4}
            fallback={
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {skeletonIds.map((id) => (
                        <Skeleton key={id} />
                    ))}
                </div>
            }
            gap={10}
        >
            {items.length > 0
                ? items.map((item) => {
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
                  })
                : skeletonIds.map((id) => <Skeleton key={id} />)}
        </Masonry>
    );
}
