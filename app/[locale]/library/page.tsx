import { ExtensionIngestPanel } from "@/components/library/extension-ingest-panel";
import { ExtensionLibraryGrids } from "@/components/library/extension-library-grids";
import { PageShell } from "@/components/layouts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { auth } from "@/lib/auth/server";
import { getLibraryItemsForUser } from "@/lib/library/get-library-items";
import { INTEGRATIONS } from "@/lib/integrations/supports";
import { prisma } from "@/prisma";
import { headers } from "next/headers";
import Image from "next/image";

const EMPTY_SYNC_HINT =
    "Run a sync from the Cache browser extension after setting your ingest URL and token. Items appear here after each successful server sync.";

export default async function LibraryPage({
    params,
}: Readonly<{
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const userId = session?.user?.id;
    if (!userId) {
        return null;
    }

    const [user, { instagram, tiktok }] = await Promise.all([
        prisma.user.findUnique({
            select: { extensionIngestToken: true },
            where: { id: userId },
        }),
        getLibraryItemsForUser(userId),
    ]);

    return (
        <PageShell>
            <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:justify-between">
                <aside className="relative flex min-h-full w-full shrink-0 flex-col gap-8 p-8 lg:max-w-[400px] lg:justify-between">
                    <div className="flex w-full flex-col gap-6 lg:sticky lg:top-8">
                        <Image
                            alt="App Icon"
                            className="block"
                            fetchPriority="high"
                            height={50}
                            loading="eager"
                            priority
                            src="/images/cache-app-icon.png"
                            width={200}
                        />
                        <div className="flex flex-col gap-3 text-balance md:gap-4">
                            <span className="font-medium text-sm">
                                Connected accounts
                            </span>
                            <ul className="flex flex-col gap-1">
                                {INTEGRATIONS.map(
                                    ({ id, label, description, Icon }) => (
                                        <li key={id}>
                                            <div className="flex items-center gap-3 rounded-xl py-2 pr-2">
                                                <Avatar
                                                    aria-label={label}
                                                    className="size-10 rounded-xl ring-1 ring-border/60"
                                                >
                                                    <AvatarFallback className="rounded-xl bg-card text-foreground">
                                                        <Icon
                                                            aria-hidden
                                                            className="size-5 shrink-0"
                                                        />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                    <span className="font-medium text-sm">
                                                        {label}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs leading-snug">
                                                        {description}
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                        <ExtensionIngestPanel
                            locale={locale}
                            token={user?.extensionIngestToken ?? null}
                        />
                    </div>
                    <div className="flex w-full flex-col gap-3 lg:sticky lg:bottom-8" />
                </aside>
                <div className="flex w-full max-w-[1024px] flex-col items-center gap-12 p-8 2xl:mx-auto">
                    <div className="flex w-full flex-col gap-2">
                        <h1 className="font-semibold text-2xl tracking-tight">
                            Library
                        </h1>
                        <p className="max-w-prose text-muted-foreground text-sm leading-relaxed">
                            Posts synced from the extension appear below by
                            source.
                        </p>
                    </div>
                    <ExtensionLibraryGrids
                        emptyHint={EMPTY_SYNC_HINT}
                        instagram={instagram}
                        tiktok={tiktok}
                        titleInstagram="Instagram Saved"
                        titleTiktok="TikTok Favorites"
                    />
                </div>
            </div>
        </PageShell>
    );
}
