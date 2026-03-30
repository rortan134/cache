import type { LibraryItem } from "@/prisma/client/client";
import { normalizeURL } from "@/lib/url";

interface Props {
    readonly emptyHint: string;
    readonly instagram: LibraryItem[];
    readonly tiktok: LibraryItem[];
    readonly titleInstagram: string;
    readonly titleTiktok: string;
}

function ItemCard({ item }: { readonly item: LibraryItem }) {
    const href = normalizeURL(item.url);
    const alt = (item.caption ?? "").trim() || "Saved item";

    return (
        <li>
            <a
                className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card ring-1 ring-border/40 transition hover:border-border hover:ring-border/80"
                href={href}
                rel="noopener noreferrer"
                target="_blank"
            >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
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
    );
}

function Section({
    emptyHint,
    items,
    title,
}: {
    readonly emptyHint: string;
    readonly items: LibraryItem[];
    readonly title: string;
}) {
    return (
        <section className="flex w-full flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold text-lg tracking-tight">
                    {title}
                </h2>
                <span className="text-muted-foreground text-sm">
                    {items.length}
                </span>
            </div>
            {items.length === 0 ? (
                <p className="max-w-prose text-muted-foreground text-sm leading-relaxed">
                    {emptyHint}
                </p>
            ) : (
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {items.map((item) => (
                        <ItemCard item={item} key={item.id} />
                    ))}
                </ul>
            )}
        </section>
    );
}

export function ExtensionLibraryGrids({
    emptyHint,
    instagram,
    tiktok,
    titleInstagram,
    titleTiktok,
}: Props) {
    return (
        <div className="flex w-full flex-col gap-12">
            <Section
                emptyHint={emptyHint}
                items={instagram}
                title={titleInstagram}
            />
            <Section emptyHint={emptyHint} items={tiktok} title={titleTiktok} />
        </div>
    );
}
