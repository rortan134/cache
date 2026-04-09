"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { XSocial } from "@/components/ui/integration-icons";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { LocaleSelector } from "gt-next";
import { ArrowUpRight, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const WHITESPACE_PATTERN = /\s+/;

interface UserMenuSubscription {
    billingInterval: string | null;
    cancelAtPeriodEnd: boolean;
    periodEnd: string | null;
    plan: string;
    status: string | null;
}

interface UserMenuProps {
    locale: string;
    subscription: UserMenuSubscription | null;
    user: {
        email: string;
        image: string | null;
        name: string | null;
    };
}

function getInitials(name: string | null, email: string): string {
    const source = name?.trim() || email.trim();
    const parts = source.split(WHITESPACE_PATTERN).filter(Boolean);

    if (parts.length >= 2) {
        return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
}

function formatSubscriptionLabel(subscription: UserMenuSubscription | null): {
    detail: string;
    tone: "default" | "muted" | "warn";
} {
    if (!subscription) {
        return {
            detail: "Free plan",
            tone: "muted",
        };
    }

    const planLabel = subscription.plan
        ? subscription.plan[0]?.toUpperCase() + subscription.plan.slice(1)
        : "Subscription";

    let intervalLabel: string | null = null;
    if (subscription.billingInterval === "year") {
        intervalLabel = "yearly";
    } else if (subscription.billingInterval === "month") {
        intervalLabel = "monthly";
    }

    const expiresAt = subscription.periodEnd
        ? new Intl.DateTimeFormat(undefined, {
              day: "numeric",
              month: "short",
          }).format(new Date(subscription.periodEnd))
        : null;

    if (subscription.cancelAtPeriodEnd) {
        return {
            detail: expiresAt
                ? `${planLabel} ends ${expiresAt}`
                : `${planLabel} ends soon`,
            tone: "warn",
        };
    }

    if (subscription.status === "trialing") {
        return {
            detail: intervalLabel
                ? `${planLabel} trial, then ${intervalLabel}`
                : `${planLabel} trial`,
            tone: "default",
        };
    }

    if (subscription.status === "active") {
        return {
            detail: intervalLabel ? `${planLabel} ${intervalLabel}` : planLabel,
            tone: "default",
        };
    }

    return {
        detail: subscription.status
            ? `${planLabel} ${subscription.status.replaceAll("_", " ")}`
            : planLabel,
        tone: "muted",
    };
}

function getToneClassName(
    tone: ReturnType<typeof formatSubscriptionLabel>["tone"]
): string {
    if (tone === "warn") {
        return "bg-amber-100 text-amber-900";
    }

    if (tone === "muted") {
        return "bg-muted text-muted-foreground";
    }

    return "bg-primary/10 text-primary";
}

export function UserMenu({
    locale,
    subscription,
    user,
}: UserMenuProps): React.ReactElement {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const subscriptionLabel = formatSubscriptionLabel(subscription);
    const returnPath = `${typeof window === "undefined" ? "" : window.location.origin}/${locale}/library`;
    const hasManagedSubscription =
        subscription?.status === "active" ||
        subscription?.status === "trialing";

    const handleUpgrade = () => {
        startTransition(async () => {
            setErrorMessage(null);

            try {
                const { data, error } = await authClient.subscription.upgrade({
                    cancelUrl: returnPath,
                    plan: "pro",
                    successUrl: returnPath,
                });

                if (error) {
                    setErrorMessage(
                        error.message ?? "We couldn't open checkout right now."
                    );
                    return;
                }

                if (data?.url) {
                    window.location.assign(data.url);
                    return;
                }

                setErrorMessage("We couldn't open checkout right now.");
            } catch {
                setErrorMessage("We couldn't open checkout right now.");
            }
        });
    };

    const handleBillingPortal = () => {
        startTransition(async () => {
            setErrorMessage(null);

            try {
                const { data, error } =
                    await authClient.subscription.billingPortal({
                        returnUrl: returnPath,
                    });

                if (error) {
                    setErrorMessage(
                        error.message ?? "We couldn't open billing right now."
                    );
                    return;
                }

                if (data?.url) {
                    window.location.assign(data.url);
                    return;
                }

                setErrorMessage("We couldn't open billing right now.");
            } catch {
                setErrorMessage("We couldn't open billing right now.");
            }
        });
    };

    const handleLogout = () => {
        router.push(`/${locale}/logout`);
    };

    return (
        <Popover>
            <PopoverTrigger
                className="w-full justify-between"
                render={<Button size="xl" variant="ghost" />}
            >
                <span className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-8 ring-1 ring-border/50">
                        <AvatarImage
                            alt={user.name ?? user.email}
                            src={user.image ?? undefined}
                        />
                        <AvatarFallback>
                            {getInitials(user.name, user.email)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="flex min-w-0 flex-col items-start text-left">
                        <span className="truncate font-medium text-sm">
                            {user.name ?? "Account"}
                        </span>
                        <span className="truncate text-muted-foreground text-xs">
                            {user.email}
                        </span>
                    </span>
                </span>
                <ChevronsUpDown
                    aria-hidden
                    className="size-4 text-muted-foreground"
                />
            </PopoverTrigger>
            <PopoverPopup align="start" positionMethod="fixed" side="top">
                <div className="flex flex-col gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                            {user.name ?? "Cache account"}
                        </p>
                        <p className="truncate text-muted-foreground text-sm">
                            {user.email}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge
                                className={cn(
                                    "h-6! w-full",
                                    getToneClassName(subscriptionLabel.tone)
                                )}
                                variant="secondary"
                            >
                                {subscriptionLabel.detail}
                            </Badge>
                        </div>
                    </div>
                    <div className="relative -my-1">
                        <Separator className="absolute left-1/2 -translate-x-1/2 data-horizontal:w-[400px]" />
                    </div>
                    <div className="-mx-2 flex flex-col gap-1">
                        <Button
                            className="justify-between"
                            disabled
                            variant="ghost"
                        >
                            Theme
                            <span>Soon</span>
                        </Button>
                    </div>
                    <div className="relative -my-1">
                        <Separator className="absolute left-1/2 -translate-x-1/2 data-horizontal:w-[400px]" />
                    </div>
                    <div className="-mx-2 flex flex-col gap-1">
                        {hasManagedSubscription ? (
                            <Button
                                className="justify-start"
                                loading={isPending}
                                onClick={handleBillingPortal}
                                variant="ghost"
                            >
                                Billing
                            </Button>
                        ) : (
                            <>
                                <Button
                                    className="justify-start"
                                    render={<Link href="/pricing" />}
                                    variant="ghost"
                                >
                                    Pricing
                                </Button>
                                <Button
                                    className="justify-start"
                                    loading={isPending}
                                    onClick={handleUpgrade}
                                    variant="ghost"
                                >
                                    Upgrade to Pro
                                </Button>
                            </>
                        )}
                        <Button
                            className="justify-between"
                            render={<Link href="/changelog" />}
                            variant="ghost"
                        >
                            Changelog
                            <ArrowUpRight className="ml-auto inline-block size-4.5 shrink-0" />
                        </Button>
                        <Button
                            className="justify-between"
                            render={<Link href="mailto:gsmt.dev@gmail.com" />}
                            variant="ghost"
                        >
                            Support
                            <ArrowUpRight className="ml-auto inline-block size-4.5 shrink-0" />
                        </Button>
                        <Button
                            className="justify-start"
                            onClick={handleLogout}
                            variant="ghost"
                        >
                            Log out
                        </Button>
                    </div>
                    {errorMessage ? (
                        <p className="text-destructive text-xs">
                            {errorMessage}
                        </p>
                    ) : null}
                    <div className="relative -my-1">
                        <Separator className="absolute left-1/2 -translate-x-1/2 data-horizontal:w-[400px]" />
                    </div>
                    <LocaleSelector />
                    <div className="relative -my-1">
                        <Separator className="absolute left-1/2 -translate-x-1/2 data-horizontal:w-[400px]" />
                    </div>
                    <div className="-mx-1 flex flex-wrap opacity-75">
                        <Button
                            render={<Link href="/legal/privacy-policy" />}
                            size="xs"
                            variant="ghost"
                        >
                            Privacy
                        </Button>
                        <Button
                            render={<Link href="/legal/terms-of-service" />}
                            size="xs"
                            variant="ghost"
                        >
                            Terms
                        </Button>
                        <Button
                            className="ml-auto"
                            render={
                                <Link
                                    href="https://x.com/gsmmtt_"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                />
                            }
                            size="icon-xs"
                            variant="ghost"
                        >
                            <XSocial className="size-4" />
                        </Button>
                    </div>
                </div>
            </PopoverPopup>
        </Popover>
    );
}
