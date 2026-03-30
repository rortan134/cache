import { LibraryBrowser } from "@/components/library/library-browser";
import { IntegrationSetupHeading } from "@/components/library/wizard-setup";
import { PageShell, PageSidebarShell } from "@/components/shared/layouts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth/server";
import { gtPublicString } from "@/lib/gt-public-json";
import { INTEGRATIONS } from "@/lib/integrations/supports";
import { getLibraryItemsForUser } from "@/lib/library/get-library-items";
import LogoIconImage from "@/public/cache-app-icon.png";
import { LocaleSelector } from "gt-next";
import type { Metadata } from "next";
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

export default async function LibraryPage() {
    const session = await getServerSession();
    const userId = session?.user?.id;

    if (!userId) {
        return null;
    }

    const { items } = await getLibraryItemsForUser(userId);

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
                            <Link href="/library">
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
                            </Link>
                            <div className="flex flex-col gap-2 text-balance md:gap-4">
                                <IntegrationSetupHeading items={items} />
                                <ul className="flex flex-col gap-2">
                                    {INTEGRATIONS.map(
                                        ({ id, label, description, Icon }) => (
                                            <li key={id}>
                                                <div className="flex items-center gap-3 rounded-xl py-2 pr-2">
                                                    <Avatar
                                                        aria-label={label}
                                                        className="size-10 rounded-lg ring-1 ring-border/60"
                                                    >
                                                        <AvatarFallback className="rounded-lg bg-card text-foreground">
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
                        </>
                    }
                />
                <div className="flex w-full max-w-[1024px] flex-col items-center gap-12 p-8 2xl:mx-auto">
                    <LibraryBrowser items={items} />
                </div>
            </div>
        </PageShell>
    );
}
