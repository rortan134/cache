import { UserMenu } from "@/components/auth/user-menu";
import { LogoContextMenu } from "@/components/branding/logo-context-menu";
import { LibrarySidebarIntegrations } from "@/components/library/integrations";
import { LibraryBrowser } from "@/components/library/library-browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { prisma } from "@/prisma";
import { LibraryItemSource } from "@/prisma/client/enums";
import LogoIconImage from "@/public/cache-app-icon.png";
import { ChevronDown, Component, PlusIcon, Sparkles } from "lucide-react";
import type { Metadata } from "next";
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
            "Saved items from your connected accounts and extension imports appear below by source."
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
    const xParked = !(process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET);
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
                        in: ["google", "pinterest", "soundcloud", "x"],
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
        linkedAccounts.map((account) => account.providerId)
    );
    const soundcloudConnected =
        !soundcloudParked && soundcloudLikes?.status !== "NOT_CONNECTED";
    const prioritizedSubscription =
        subscriptions.find(
            (subscription) =>
                subscription.status === "active" ||
                subscription.status === "trialing"
        ) ??
        subscriptions[0] ??
        null;

    const isIntegrationConnected = (
        id: (typeof INTEGRATIONS)[number]["id"]
    ) => {
        if (id === "google-photos") {
            return linkedProviderIds.has("google");
        }
        if (id === "pinterest") {
            return linkedProviderIds.has("pinterest");
        }
        if (id === "chrome") {
            return items.some(
                (item) => item.source === LibraryItemSource.chrome_bookmarks
            );
        }
        if (id === "x") {
            return linkedProviderIds.has("x");
        }
        if (id === "youtube") {
            return items.some(
                (item) => item.source === LibraryItemSource.youtube_watch_later
            );
        }
        if (id === "soundcloud") {
            return soundcloudConnected;
        }
        return false;
    };
    const serverConnectedIntegrationIds = INTEGRATIONS.flatMap(({ id }) =>
        isIntegrationConnected(id) ? [id] : []
    );
    const parkedIntegrationIds = INTEGRATIONS.flatMap(({ id }) => {
        if (id === "soundcloud" && soundcloudParked) {
            return [id];
        }
        if (id === "x" && xParked) {
            return [id];
        }
        return [];
    });

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
                            <LogoContextMenu
                                href="/library"
                                src={LogoIconImage}
                            />
                            <LibrarySidebarIntegrations
                                items={items}
                                locale={locale}
                                parkedIntegrationIds={parkedIntegrationIds}
                                serverConnectedIntegrationIds={
                                    serverConnectedIntegrationIds
                                }
                            />
                            <div className="flex w-full items-center gap-2">
                                <Collapsible className="w-full flex-1">
                                    <CollapsibleTrigger className="flex items-center gap-2 rounded-full bg-muted/94 py-2.5 pr-3 pl-2.5 text-left">
                                        <Component
                                            aria-hidden
                                            className="inline-block size-4.5 shrink-0"
                                            focusable="false"
                                        />
                                        <span className="select-none font-medium text-sm leading-tight">
                                            Collections
                                        </span>
                                        <Badge size="sm" variant="outline">
                                            <Sparkles className="size-3" />
                                            AI Powered
                                        </Badge>
                                        <ChevronDown
                                            aria-hidden
                                            className="pointer-events-none ml-auto inline-block size-4 shrink-0 transition-transform group-data-[panel-open]:rotate-180"
                                            focusable="false"
                                        />
                                    </CollapsibleTrigger>
                                    <CollapsiblePanel />
                                </Collapsible>
                                <Button
                                    aria-label="Create new collection"
                                    className="rounded-full"
                                    size="icon"
                                    variant="secondary"
                                >
                                    <span className="sr-only">
                                        Create new collection
                                    </span>
                                    <PlusIcon
                                        aria-hidden
                                        className="inline-block size-4 shrink-0"
                                        focusable="false"
                                    />
                                </Button>
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
