"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { LocaleSelector } from "gt-next";
import { ChevronsUpDown, CreditCard, LogOut, Sparkles } from "lucide-react";
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

function readRedirectUrl(response: unknown): string | null {
    if (typeof response !== "object" || response === null) {
        return null;
    }

    const candidate = response as { url?: unknown };
    return typeof candidate.url === "string" ? candidate.url : null;
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
    const returnPath = `/${locale}/library`;
    const hasManagedSubscription =
        subscription?.status === "active" ||
        subscription?.status === "trialing";

    const handleUpgrade = () => {
        startTransition(async () => {
            setErrorMessage(null);

            try {
                const response = await authClient.$fetch(
                    "/subscription/upgrade",
                    {
                        body: {
                            cancelUrl: returnPath,
                            plan: "pro",
                            successUrl: returnPath,
                        },
                        method: "POST",
                    }
                );
                const redirectUrl = readRedirectUrl(response);

                if (redirectUrl) {
                    window.location.assign(redirectUrl);
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
                const response = await authClient.$fetch(
                    "/subscription/billing-portal",
                    {
                        body: {
                            returnUrl: returnPath,
                        },
                        method: "POST",
                    }
                );
                const redirectUrl = readRedirectUrl(response);

                if (redirectUrl) {
                    window.location.assign(redirectUrl);
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
                className="w-full"
                render={<Button variant="ghost" />}
            >
                <span className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-9 ring-1 ring-border/60">
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
            <PopoverPopup
                align="start"
                className="w-[min(22rem,calc(100vw-2rem))]"
                side="top"
            >
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                        <Avatar className="size-11 ring-1 ring-border/60">
                            <AvatarImage
                                alt={user.name ?? user.email}
                                src={user.image ?? undefined}
                            />
                            <AvatarFallback className="text-sm">
                                {getInitials(user.name, user.email)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-sm">
                                {user.name ?? "Cache account"}
                            </p>
                            <p className="truncate text-muted-foreground text-sm">
                                {user.email}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span
                                    className={cn(
                                        "inline-flex items-center rounded-full px-2 py-0.5 font-medium text-[11px]",
                                        getToneClassName(subscriptionLabel.tone)
                                    )}
                                >
                                    {subscriptionLabel.detail}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        {hasManagedSubscription ? (
                            <Button
                                className="justify-start"
                                loading={isPending}
                                onClick={handleBillingPortal}
                                size="sm"
                                variant="ghost"
                            >
                                <CreditCard />
                                Billing
                            </Button>
                        ) : (
                            <Button
                                className="justify-start"
                                loading={isPending}
                                onClick={handleUpgrade}
                                size="sm"
                                variant="ghost"
                            >
                                <Sparkles />
                                Upgrade to Pro
                            </Button>
                        )}
                        <Button
                            className="justify-start"
                            onClick={handleLogout}
                            size="sm"
                            variant="ghost"
                        >
                            <LogOut />
                            Log out
                        </Button>
                    </div>
                    {errorMessage ? (
                        <p className="text-destructive text-xs">
                            {errorMessage}
                        </p>
                    ) : null}
                    <LocaleSelector />
                </div>
            </PopoverPopup>
        </Popover>
    );
}
