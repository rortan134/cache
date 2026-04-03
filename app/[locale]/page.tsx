import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import {
    SessionHint,
    SignedInOnly,
    SignedOutOnly,
} from "@/components/auth/session";
import { Button } from "@/components/ui/button";
import { GradientWaveText } from "@/components/ui/gradient-wave-text";
import { Chrome } from "@/components/ui/integration-icons";
import { PageShell, PageSidebarShell } from "@/components/ui/layouts";
import { LogoContextMenu } from "@/components/ui/logo-context-menu";
import { gtPublicString } from "@/lib/gt-public-json";
import { INTEGRATIONS } from "@/lib/integrations/supports";
import LogoIconImage from "@/public/cache-app-icon.png";
import QRCodeDownloadImage from "@/public/download-qrcode.png";
import { LocaleSelector, T } from "gt-next";
import { ChevronRight } from "lucide-react";
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
            "home.metadata.description",
            "One place to view, manage, and organize bookmarks across browsers and platforms — built for power users who save at volume."
        ),
        title: gtPublicString(
            locale,
            "home.metadata.title",
            "Unify your bookmarks across every platform"
        ),
    };
}

export default async function Home({
    params,
}: Readonly<{
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;

    return (
        <PageShell>
            <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:justify-between">
                <PageSidebarShell
                    bottom={
                        <>
                            <div className="hidden items-center gap-3 lg:flex">
                                <Image
                                    alt="Download QR Code"
                                    className="size-20"
                                    height={80}
                                    src={QRCodeDownloadImage}
                                    width={80}
                                />
                                <div className="flex flex-col gap-1.5 pb-[2px]">
                                    <p className="font-medium font-regular text-[#0A0B0D] text-[18px] tracking-[-3%]">
                                        <T context="Chrome web store browser extension">
                                            Install the extension
                                        </T>
                                    </p>
                                    <p className="flex shrink-0 flex-row items-center gap-1.5 truncate text-[#0A0B0D] text-[1rem] leading-[1.22] tracking-[-3%]">
                                        <span>
                                            <Chrome className="size-4" />
                                        </span>
                                        <span className="opacity-50">
                                            Chrome Web Store
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <LocaleSelector />
                        </>
                    }
                    top={
                        <>
                            <LogoContextMenu
                                href="/library"
                                src={LogoIconImage}
                            />
                            <div className="flex flex-col gap-3 text-balance">
                                <T context="'Cache' is the product's name">
                                    <h1 className="text-balance font-medium text-[3rem] leading-[98%] md:text-[4rem] md:tracking-[-0.21875rem]">
                                        <GradientWaveText ariaLabel="Unify your bookmarks">
                                            Unify your bookmarks.
                                        </GradientWaveText>
                                    </h1>
                                    <p className="font-medium text-[#0A0B0D] text-[1rem] leading-[1.22] tracking-[-3%] opacity-50 lg:max-w-[320px]">
                                        Meet Cache – one place to collect,
                                        organize, and rediscover everything
                                        you’ve saved across platforms, right in
                                        your browser.
                                    </p>
                                </T>
                            </div>
                            <SignedOutOnly>
                                <GoogleSignInButton locale={locale}>
                                    <T context="Sign in/up CTA button">
                                        Continue with Google
                                    </T>
                                </GoogleSignInButton>
                            </SignedOutOnly>
                            <SignedInOnly>
                                <Button
                                    render={
                                        <Link href="/library">
                                            Go to my library
                                            <ChevronRight className="size-4" />
                                        </Link>
                                    }
                                    size="xl"
                                />
                            </SignedInOnly>
                            <SessionHint />
                        </>
                    }
                />
                <div className="flex w-full max-w-[1024px] flex-col items-center gap-12 p-8 2xl:mx-auto">
                    <div className="aspect-video h-auto w-full rounded-2xl bg-muted" />
                    <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-[40px]">
                        <div className="flex max-w-[340px] flex-col gap-[12px] py-[20px] md:gap-[16px]">
                            <T context="Library">
                                <h2 className="font-medium text-[#0A0B0D] text-[28px] leading-[1.1] tracking-[-1.28px] lg:text-[32px]">
                                    Curate a library of all the content you love
                                </h2>
                                <p className="tracking=[-3%] text-pretty font-medium font-regular text-[#0A0B0D] text-[16px] leading-[1.2] opacity-50">
                                    Get inspired, find that one lesson, advice,
                                    recipe, or idea you've been looking for, in
                                    the span of a coffee break.
                                </p>
                            </T>
                        </div>
                        <div className="order-first aspect-square w-full overflow-hidden rounded-2xl bg-muted md:order-last">
                            <figure className="overflow-hidden">
                                {/* <Image alt="" height={800} src="" width={800} /> */}
                            </figure>
                        </div>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-[40px]">
                        <div className="flex max-w-[340px] flex-col gap-[12px] py-[20px] md:gap-[16px]">
                            <T context="Integrations">
                                <h2 className="font-medium text-[#0A0B0D] text-[28px] leading-[1.1] tracking-[-1.28px] lg:text-[32px]">
                                    Connect your favorite media platforms –
                                    Backfill everything you've ever saved
                                </h2>
                                <p className="tracking=[-3%] text-pretty font-medium font-regular text-[#0A0B0D] text-[16px] leading-[1.2] opacity-50">
                                    Bring together bookmarks from social, video,
                                    and the browser automatically. Ditch the
                                    endless scrolling and tabbing through
                                    multiple platforms to find what matters to
                                    you.
                                </p>
                            </T>
                            <div className="flex w-full items-center gap-5">
                                {INTEGRATIONS.map(({ id, Icon }) => (
                                    <Icon className="size-6" key={id} />
                                ))}
                            </div>
                        </div>
                        <div className="order-first aspect-square w-full overflow-hidden rounded-2xl bg-muted md:order-last">
                            <figure className="overflow-hidden">
                                {/* <Image alt="" height={800} src="" width={800} /> */}
                            </figure>
                        </div>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-[40px]">
                        <div className="flex max-w-[340px] flex-col gap-[12px] py-[20px] md:gap-[16px]">
                            <T context="Feed">
                                <h2 className="font-medium text-[#0A0B0D] text-[28px] leading-[1.1] tracking-[-1.28px] lg:text-[32px]">
                                    Search and explore from a single, fast feed
                                </h2>
                                <p className="tracking=[-3%] text-pretty font-medium font-regular text-[#0A0B0D] text-[16px] leading-[1.2] opacity-50">
                                    Streamline the way you consume and reengage
                                    with your saved content from a single clean
                                    and powerful interface.
                                </p>
                            </T>
                        </div>
                        <div className="order-first aspect-square w-full overflow-hidden rounded-2xl bg-muted md:order-last">
                            <figure className="overflow-hidden">
                                {/* <Image alt="" height={800} src="" width={800} /> */}
                            </figure>
                        </div>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-[40px]">
                        <div className="flex max-w-[340px] flex-col gap-[12px] py-[20px] md:gap-[16px]">
                            <T context="Habits">
                                <h2 className="font-medium text-[#0A0B0D] text-[28px] leading-[1.1] tracking-[-1.28px] lg:text-[32px]">
                                    Stop leaving it for "later"
                                </h2>
                                <p className="tracking=[-3%] text-pretty font-medium font-regular text-[#0A0B0D] text-[16px] leading-[1.2] opacity-50">
                                    Create more actionable opportunities for
                                    yourself by having your most insightful
                                    saved content top of mind instead of losing
                                    them in a backlog of forgotten bookmarks.
                                </p>
                            </T>
                        </div>
                        <div className="order-first aspect-square w-full overflow-hidden rounded-2xl bg-muted md:order-last">
                            <figure className="overflow-hidden">
                                {/* <Image alt="" height={800} src="" width={800} /> */}
                            </figure>
                        </div>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-[40px]">
                        <div className="flex max-w-[340px] flex-col gap-[12px] py-[20px] md:gap-[16px]">
                            <T context="Organization">
                                <h2 className="font-medium text-[#0A0B0D] text-[28px] leading-[1.1] tracking-[-1.28px] lg:text-[32px]">
                                    Stay organized. Spot the stale, keep the
                                    useful
                                </h2>
                                <p className="tracking=[-3%] text-pretty font-medium font-regular text-[#0A0B0D] text-[16px] leading-[1.2] opacity-50">
                                    Import once and go from messy to organized
                                    in minutes.
                                </p>
                            </T>
                        </div>
                        <div className="order-first aspect-square w-full overflow-hidden rounded-2xl bg-muted md:order-last">
                            <figure className="overflow-hidden">
                                {/* <Image alt="" height={800} src="" width={800} /> */}
                            </figure>
                        </div>
                    </div>
                    <footer>
                        <div className="relative mx-auto mt-auto grid h-auto w-full grid-cols-12 gap-x-[min(2.25vw,32px)] pt-[120px] lg:top-0">
                            <div className="relative z-20 col-span-full mx-auto grid w-full grid-cols-12 flex-col gap-6 gap-x-[min(2.25vw,32px)] pb-4! md:pb-6! lg:mb-20 lg:py-8 lg:pb-8!">
                                <div className="col-span-full flex flex-col gap-4">
                                    <div className="col-span-full flex h-full flex-row gap-6 text-[#0A0B0D] text-[0.8rem] leading-[1.22] tracking-[-3%] opacity-50">
                                        <Link
                                            className="underline"
                                            href="/pricing"
                                            target="_blank"
                                        >
                                            <T>
                                                <p>Pricing</p>
                                            </T>
                                        </Link>
                                        <Link
                                            className="underline"
                                            href="/legal/terms-of-service"
                                            target="_blank"
                                        >
                                            <T>
                                                <p>Terms of Service</p>
                                            </T>
                                        </Link>
                                        <Link
                                            className="underline"
                                            href="/legal/privacy-policy"
                                            target="_blank"
                                        >
                                            <T>
                                                <p>Privacy Policy</p>
                                            </T>
                                        </Link>
                                        <Link
                                            className="underline"
                                            href="/legal/cookie-policy"
                                            target="_blank"
                                        >
                                            <T>
                                                <p>Cookie Policy</p>
                                            </T>
                                        </Link>
                                        <Link
                                            className="underline"
                                            href="https://x.com/gsmmtt"
                                            rel="noreferrer noopener"
                                            target="_blank"
                                        >
                                            <p>X</p>
                                        </Link>
                                        <p>&copy; Cache. All rights reserved</p>
                                    </div>
                                </div>
                                <div className="relative col-span-full flex flex-col items-start justify-between font-sans text-[#0A0B0D] text-xs leading-[1.22] tracking-[-3%] opacity-50">
                                    <span className="opacity-90">
                                        <T context="Disclaimer">
                                            *Third-party platforms you connect
                                            through the Service are operated
                                            independently of Cache. Cache does
                                            not control their policies or how
                                            they apply them, and is not
                                            responsible for decisions those
                                            platforms make regarding your
                                            accounts or access to their
                                            services—including, without
                                            limitation, changes to
                                            availability—whether or not related
                                            to your use of Cache. You are
                                            responsible for complying with each
                                            platform's terms, policies, and
                                            community guidelines. Cache is not
                                            liable for any inconvenience, loss,
                                            or other outcome arising from your
                                            relationship with those platforms or
                                            your use of the Service in
                                            connection with them. Additional
                                            detail may be found
                                        </T>
                                    </span>
                                    <div className="absolute inset-x-0 mt-8 h-[200px] w-full overflow-clip md:mt-4 lg:mt-0">
                                        <svg
                                            aria-hidden
                                            aria-label="Branding"
                                            className="overflow-fade-bottom mx-auto flex h-auto w-full justify-center"
                                            fill="none"
                                            height="200"
                                            role="presentation"
                                            viewBox="0 0 426 200"
                                            width="426"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <rect
                                                className="origin-top transition-transform duration-300 hover:scale-95"
                                                fill="black"
                                                height="100"
                                                rx="30"
                                                width="100"
                                                y="50"
                                            />
                                            <rect
                                                className="origin-top transition-transform duration-300 hover:scale-95"
                                                fill="black"
                                                height="100"
                                                rx="48"
                                                width="100"
                                                x="108.667"
                                                y="50"
                                            />
                                            <rect
                                                className="origin-top transition-transform duration-300 hover:scale-95"
                                                fill="black"
                                                height="100"
                                                rx="28"
                                                width="100"
                                                x="217.333"
                                                y="50"
                                            />
                                            <rect
                                                className="origin-top transition-transform duration-300 hover:scale-95"
                                                fill="black"
                                                height="100"
                                                rx="38"
                                                width="100"
                                                x="326"
                                                y="50"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </PageShell>
    );
}
