import { LibraryBrowser } from "@/components/library/library-browser";
import { IntegrationSetupWizard } from "@/components/library/setup-wizard";
import { SidebarIntegrationAction } from "@/components/library/sidebar-integration-action";
import { UserMenu } from "@/components/auth/user-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Collapsible,
    CollapsiblePanel,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PageShell, PageSidebarShell } from "@/components/ui/layouts";
import { getServerSession } from "@/lib/auth/server";
import { gtPublicString } from "@/lib/gt-public-json";
import { INTEGRATIONS } from "@/lib/integrations/supports";
import { getLibraryItemsForUser } from "@/lib/library/get-library-items";
import { LibraryItemSource } from "@/prisma/client/enums";
import { prisma } from "@/prisma";
import LogoIconImage from "@/public/cache-app-icon.png";
import { ChevronDown, Component } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLatestSoundcloudLikes } from "./actions";

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
            "Posts synced from the extension appear below by source.",
        ),
        title: gtPublicString(locale, "library.metadata.title", "My library"),
    };
}

export default async function LibraryPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const soundcloudParked = !(
        process.env.SOUNDCLOUD_CLIENT_ID && process.env.SOUNDCLOUD_CLIENT_SECRET
    );
    const session = await getServerSession();
    const userId = session?.user?.id;

    if (!userId) {
        return redirect("/");
    }

    const [{ items }, linkedAccounts, soundcloudLikes, subscriptions] =
        await Promise.all([
            getLibraryItemsForUser(userId),
            prisma.account.findMany({
                select: { providerId: true },
                where: {
                    providerId: {
                        in: ["google", "pinterest", "soundcloud"],
                    },
                    userId,
                },
            }),
            soundcloudParked
                ? Promise.resolve(null)
                : getLatestSoundcloudLikes(),
            prisma.subscription.findMany({
                select: {
                    billingInterval: true,
                    cancelAtPeriodEnd: true,
                    periodEnd: true,
                    plan: true,
                    status: true,
                },
                where: {
                    referenceId: userId,
                },
            }),
        ]);

    const linkedProviderIds = new Set(
        linkedAccounts.map((account) => account.providerId),
    );
    const soundcloudConnected =
        !soundcloudParked && soundcloudLikes?.status !== "NOT_CONNECTED";
    const prioritizedSubscription =
        subscriptions.find(
            (subscription) =>
                subscription.status === "active" ||
                subscription.status === "trialing",
        ) ??
        subscriptions[0] ??
        null;

    const isIntegrationConnected = (
        id: (typeof INTEGRATIONS)[number]["id"],
    ) => {
        if (id === "google-photos") {
            return linkedProviderIds.has("google");
        }
        if (id === "pinterest") {
            return linkedProviderIds.has("pinterest");
        }
        if (id === "chrome") {
            return items.some(
                (item) => item.source === LibraryItemSource.chrome_bookmarks,
            );
        }
        if (id === "soundcloud") {
            return soundcloudConnected;
        }
        return false;
    };

    return (
        <PageShell>
            <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:justify-between">
                <PageSidebarShell
                    bottom={
                        <UserMenu
                            locale={locale}
                            subscription={
                                prioritizedSubscription
                                    ? {
                                          billingInterval:
                                              prioritizedSubscription.billingInterval,
                                          cancelAtPeriodEnd:
                                              prioritizedSubscription.cancelAtPeriodEnd ??
                                              false,
                                          periodEnd:
                                              prioritizedSubscription.periodEnd?.toISOString() ??
                                              null,
                                          plan: prioritizedSubscription.plan,
                                          status: prioritizedSubscription.status,
                                      }
                                    : null
                            }
                            user={{
                                email: session.user.email,
                                image: session.user.image ?? null,
                                name: session.user.name ?? null,
                            }}
                        />
                    }
                    top={
                        <>
                            <Link draggable={false} href="/library">
                                <Image
                                    alt="App Icon"
                                    className="block select-none"
                                    draggable={false}
                                    fetchPriority="high"
                                    height={50}
                                    loading="eager"
                                    priority
                                    src={LogoIconImage}
                                    width={200}
                                />
                            </Link>
                            <Collapsible>
                                <div className="flex flex-col gap-3 text-balance">
                                    <CollapsibleTrigger
                                        render={
                                            <IntegrationSetupWizard
                                                items={items}
                                            />
                                        }
                                    />
                                    <CollapsiblePanel>
                                        <ul className="flex flex-col gap-1">
                                            {INTEGRATIONS.map(
                                                ({
                                                    id,
                                                    label,
                                                    description,
                                                    Icon,
                                                }) => (
                                                    <li key={id}>
                                                        <div className="flex items-center gap-2 rounded-xl py-2 pr-2">
                                                            <Avatar
                                                                aria-label={
                                                                    label
                                                                }
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
                                                                <span className="text-[11px] text-muted-foreground leading-snug">
                                                                    {
                                                                        description
                                                                    }
                                                                </span>
                                                            </div>
                                                            <SidebarIntegrationAction
                                                                connected={isIntegrationConnected(
                                                                    id,
                                                                )}
                                                                id={id}
                                                                locale={locale}
                                                                soundcloudParked={
                                                                    soundcloudParked
                                                                }
                                                            />
                                                        </div>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </CollapsiblePanel>
                                </div>
                            </Collapsible>
                            <Collapsible>
                                <CollapsibleTrigger className="flex items-center gap-2 rounded-full bg-muted/94 px-2.5 py-1.5">
                                    <Component
                                        aria-hidden
                                        className="inline-block size-4 shrink-0"
                                        focusable="false"
                                    />
                                    Collections
                                    <ChevronDown
                                        aria-hidden
                                        className="ml-auto inline-block size-4 shrink-0"
                                        focusable="false"
                                    />
                                </CollapsibleTrigger>
                                <CollapsiblePanel />
                            </Collapsible>
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
