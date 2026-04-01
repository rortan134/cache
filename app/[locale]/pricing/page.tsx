import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SignedInOnly, SignedOutOnly } from "@/components/auth/session";
import { PricingUpgradeButton } from "@/components/billing/pricing-upgrade-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/layouts";
import { gtPublicString } from "@/lib/gt-public-json";
import { T } from "gt-next";
import { Check, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
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
            "pricing.metadata.description",
            "Simple pricing for power users who want one place to organize and rediscover everything they save."
        ),
        title: gtPublicString(locale, "pricing.metadata.title", "Pricing"),
    };
}

export default async function PricingPage({
    params,
}: Readonly<{
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;

    return (
        <PageShell className="bg-background">
            <section className="relative overflow-hidden px-6 py-16 md:px-10 md:py-24">
                <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-linear-to-b from-muted via-muted/50 to-transparent" />
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
                    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                        <Badge size="lg" variant="outline">
                            <T context="Pricing badge label">Cache Pro</T>
                        </Badge>
                        <T context="Pricing page hero copy">
                            <h1 className="max-w-4xl text-balance font-medium text-[3rem] leading-[0.95] tracking-[-0.05em] md:text-[4.5rem]">
                                Keep every bookmark within reach.
                            </h1>
                            <p className="max-w-2xl text-balance text-[1.05rem] text-muted-foreground leading-[1.35] md:text-[1.15rem]">
                                Cache Pro is for people who save a lot: one
                                clean place to collect, organize, search, and
                                rediscover everything from across the web.
                            </p>
                        </T>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-xs md:p-10">
                            <div className="flex flex-col gap-6">
                                <T context="Pricing page feature section">
                                    <div className="space-y-3">
                                        <p className="font-medium text-muted-foreground text-sm uppercase tracking-[0.18em]">
                                            What you get
                                        </p>
                                        <h2 className="text-balance font-medium text-3xl tracking-[-0.04em] md:text-4xl">
                                            One subscription for your entire
                                            saved-content workflow
                                        </h2>
                                        <p className="max-w-2xl text-pretty text-muted-foreground">
                                            No team tiers, no feature maze, and
                                            no awkward upsells. Just the full
                                            Cache experience for personal use.
                                        </p>
                                    </div>
                                </T>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <Check
                                                className="size-3.5"
                                                strokeWidth={3}
                                            />
                                        </span>
                                        <T context="Pricing page feature bullet">
                                            <p className="text-pretty text-[0.98rem] leading-6">
                                                Bring together bookmarks from
                                                browsers, social apps, and
                                                supported platforms.
                                            </p>
                                        </T>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <Check
                                                className="size-3.5"
                                                strokeWidth={3}
                                            />
                                        </span>
                                        <T context="Pricing page feature bullet">
                                            <p className="text-pretty text-[0.98rem] leading-6">
                                                Search, organize, and resurface
                                                saved content from one library.
                                            </p>
                                        </T>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <Check
                                                className="size-3.5"
                                                strokeWidth={3}
                                            />
                                        </span>
                                        <T context="Pricing page feature bullet">
                                            <p className="text-pretty text-[0.98rem] leading-6">
                                                Keep every current Cache feature
                                                unlocked as your archive grows.
                                            </p>
                                        </T>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <Check
                                                className="size-3.5"
                                                strokeWidth={3}
                                            />
                                        </span>
                                        <T context="Pricing page feature bullet">
                                            <p className="text-pretty text-[0.98rem] leading-6">
                                                Choose monthly flexibility or
                                                yearly savings with the same Pro
                                                plan.
                                            </p>
                                        </T>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="rounded-[2rem] border border-primary/15 bg-muted p-3 shadow-xs">
                            <div className="flex h-full flex-col rounded-[1.4rem] border border-border bg-background p-8 md:p-10">
                                <div className="flex items-start justify-between gap-4">
                                    <T context="Pricing page plan heading">
                                        <div className="space-y-2">
                                            <p className="font-medium text-muted-foreground text-sm uppercase tracking-[0.18em]">
                                                Pro plan
                                            </p>
                                            <h2 className="font-medium text-3xl tracking-[-0.04em]">
                                                Everything in Cache
                                            </h2>
                                        </div>
                                    </T>
                                    <Badge size="lg">
                                        <T context="Pricing page savings badge">
                                            Save 10 € yearly
                                        </T>
                                    </Badge>
                                </div>

                                <div className="mt-8 grid gap-3">
                                    <div className="rounded-2xl border border-border bg-card px-5 py-4">
                                        <T context="Monthly billing option">
                                            <div className="flex items-end justify-between gap-4">
                                                <div>
                                                    <p className="text-muted-foreground text-sm">
                                                        Monthly
                                                    </p>
                                                    <p className="mt-1 font-medium text-4xl tracking-[-0.04em]">
                                                        5 €
                                                        <span className="ml-2 font-normal text-base text-muted-foreground">
                                                            / month
                                                        </span>
                                                    </p>
                                                </div>
                                                <p className="text-muted-foreground text-sm">
                                                    Billed every month
                                                </p>
                                            </div>
                                        </T>
                                    </div>
                                    <div className="rounded-2xl border border-primary/20 bg-primary/3 px-5 py-4">
                                        <T context="Yearly billing option">
                                            <div className="flex items-end justify-between gap-4">
                                                <div>
                                                    <p className="text-muted-foreground text-sm">
                                                        Yearly
                                                    </p>
                                                    <p className="mt-1 font-medium text-4xl tracking-[-0.04em]">
                                                        50 €
                                                        <span className="ml-2 font-normal text-base text-muted-foreground">
                                                            / year
                                                        </span>
                                                    </p>
                                                </div>
                                                <p className="max-w-28 text-right text-muted-foreground text-sm">
                                                    Billed yearly
                                                </p>
                                            </div>
                                        </T>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col gap-3">
                                    <SignedOutOnly>
                                        <GoogleSignInButton locale={locale}>
                                            <T context="Pricing page sign-in CTA">
                                                Continue with Google
                                            </T>
                                        </GoogleSignInButton>
                                    </SignedOutOnly>
                                    <SignedInOnly>
                                        <PricingUpgradeButton locale={locale}>
                                            <T context="Pricing page upgrade CTA">
                                                Upgrade to Cache Pro
                                            </T>
                                        </PricingUpgradeButton>
                                    </SignedInOnly>
                                    <Button
                                        render={
                                            <Link href="/library">
                                                <T context="Pricing page secondary CTA">
                                                    Go to my library
                                                </T>
                                                <ChevronRight className="size-4" />
                                            </Link>
                                        }
                                        size="xl"
                                        variant="outline"
                                    />
                                </div>
                                <T context="Pricing page reassurance text">
                                    <p className="mt-6 text-pretty text-muted-foreground text-sm leading-6">
                                        Start with the billing cadence that fits
                                        you best. You get the same full product,
                                        whether you prefer to pay monthly or
                                        yearly.
                                    </p>
                                </T>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PageShell>
    );
}
