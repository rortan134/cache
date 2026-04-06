"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { Sparkles } from "lucide-react";
import type * as React from "react";
import { useState, useTransition } from "react";

export function PricingUpgradeButton({
    children = "Upgrade to Pro",
    locale,
}: Readonly<{
    children?: React.ReactNode;
    locale: string;
}>) {
    const [isPending, startTransition] = useTransition();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleUpgrade = () => {
        startTransition(async () => {
            setErrorMessage(null);

            try {
                const returnPath = `${window.location.origin}/${locale}/library`;
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

    return (
        <div className="flex w-full flex-col gap-2">
            <Button
                className="w-full"
                loading={isPending}
                onClick={handleUpgrade}
                size="xl"
                type="button"
            >
                <Sparkles className="size-4" />
                {children}
            </Button>
            {errorMessage ? (
                <p
                    aria-live="polite"
                    className="text-destructive text-sm"
                    role="alert"
                >
                    {errorMessage}
                </p>
            ) : null}
        </div>
    );
}
