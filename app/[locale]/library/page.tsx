import { UserMenu } from "@/components/auth/user-menu";
import { LibrarySidebarIntegrations } from "@/components/library/integrations";
import { LibraryWorkspace } from "@/components/library/library-workspace";
import { PageShell } from "@/components/ui/layouts";
import { LogoContextMenu } from "@/components/ui/logo-context-menu";
import { getServerSession } from "@/lib/auth/server";
import { gtPublicString } from "@/lib/gt-public-json";
import { INTEGRATIONS } from "@/lib/integrations/supports";
import { getLibraryItemsForUser } from "@/lib/library/get-library-items";
import { prisma } from "@/prisma";
import { LibraryItemSource } from "@/prisma/client/enums";
import LogoIconImage from "@/public/cache-app-icon.png";
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

    const [
        { collections, items },
        linkedAccounts,
        soundcloudLikes,
        subscriptions,
    ] = await Promise.all([
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
        soundcloudParked ? Promise.resolve(null) : getLatestSoundcloudLikes(),
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
            <LibraryWorkspace
                initialCollections={collections}
                initialItems={items}
                locale={locale}
                sidebarBottom={
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
                sidebarContent={
                    <LibrarySidebarIntegrations
                        items={items}
                        locale={locale}
                        parkedIntegrationIds={parkedIntegrationIds}
                        serverConnectedIntegrationIds={
                            serverConnectedIntegrationIds
                        }
                    />
                }
                sidebarHeader={
                    <LogoContextMenu href="/library" src={LogoIconImage} />
                }
            />
        </PageShell>
    );
}
