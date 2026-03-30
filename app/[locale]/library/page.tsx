import { PageShell, PageSidebarShell } from "@/components/layouts";
import { ExtensionLibraryGrids } from "@/components/library/extension-library-grids";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/server";
import { gtPublicString } from "@/lib/gt-public-json";
import { INTEGRATIONS } from "@/lib/integrations/supports";
import { getLibraryItemsForUser } from "@/lib/library/get-library-items";
import LogoIconImage from "@/public/cache-app-icon.png";
import { LocaleSelector } from "gt-next";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    return {
        description: gtPublicString(
            locale,
            "library.metadata.description",
            "Posts synced from the extension appear below by source."
        ),
        title: gtPublicString(locale, "library.metadata.title", "My library"),
    };
}

const EMPTY_SYNC_HINT =
    "Sign in on the Cache site in this browser once (so the extension can link), then run a sync from the extension on Instagram Saved or TikTok Favorites. Items appear here after each successful sync.";

export default async function LibraryPage({
    params,
}: Readonly<{
    params: Promise<{ locale: string }>;
}>) {
    await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const userId = session?.user?.id;
    if (!userId) {
        return null;
    }

    const { instagram, tiktok } = await getLibraryItemsForUser(userId);

    return (
        <PageShell>
            <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:justify-between">
                <PageSidebarShell
                    bottom={
                        <>
                            <Button
                                render={<Link href="/logout">Log out</Link>}
                                variant="ghost"
                            />
                            <LocaleSelector />
                        </>
                    }
                    top={
                        <>
                            <Image
                                alt="App Icon"
                                className="block"
                                fetchPriority="high"
                                height={50}
                                loading="eager"
                                priority
                                src={LogoIconImage}
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
                                <p className="font-medium text-[#0A0B0D] text-[1rem] leading-[1.22] tracking-[-3%] opacity-50 lg:max-w-[320px]">
                                    Cache is most effective when two or more
                                    accounts are connected.
                                </p>
                            </div>
                        </>
                    }
                />
                <div className="flex w-full max-w-[1024px] flex-col items-center gap-12 p-8 2xl:mx-auto">
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
