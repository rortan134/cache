import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { PageShell } from "@/components/layouts";
import { INTEGRATIONS } from "@/lib/integrations/supports";
import { LocaleSelector, T } from "gt-next";
import Image from "next/image";

export default async function Home({
    params,
}: Readonly<{
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;
    return (
        <PageShell>
            <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:justify-between">
                <aside className="relative flex min-h-full w-full shrink-0 flex-col gap-8 p-8 lg:max-w-[400px] lg:justify-between">
                    <div className="flex w-full flex-col gap-6 lg:sticky lg:top-8">
                        <Image
                            alt="App Icon"
                            className="block"
                            fetchPriority="high"
                            height={50}
                            loading="eager"
                            priority
                            src="/images/cache-app-icon.png"
                            width={200}
                        />
                        <div className="flex flex-col gap-2 text-balance md:gap-4">
                            <T>
                                <h1 className="text-balance font-medium text-[3rem] leading-[98%] md:text-[4rem] md:tracking-[-0.21875rem]">
                                    Unify your bookmarks.
                                </h1>
                                <p className="font-medium text-[#0A0B0D] text-[1rem] leading-[1.22] tracking-[-3%] opacity-50 lg:max-w-[320px]">
                                    One place to view, manage, and organize all
                                    of your bookmarks across platforms at
                                    volume.
                                </p>
                            </T>
                        </div>
                        <T>
                            <GoogleSignInButton locale={locale}>
                                Continue with Google
                            </GoogleSignInButton>
                        </T>
                    </div>
                    <div className="flex w-full flex-col gap-6 lg:sticky lg:bottom-8">
                        <LocaleSelector />
                    </div>
                </aside>
                <div className="flex w-full max-w-[1024px] flex-col items-center gap-12 p-8 2xl:mx-auto">
                    {/* Main content */}
                    <div className="aspect-video h-auto w-full rounded-2xl bg-stone-200" />
                    <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-[40px]">
                        <div className="flex max-w-[340px] flex-col gap-[12px] py-[20px] md:gap-[16px]">
                            <p className="font-medium text-[#0A0B0D] text-[28px] leading-[1.1] tracking-[-1.28px] lg:text-[32px]">
                                Curate a library you love
                            </p>
                            <p className="tracking=[-3%] text-pretty font-medium font-regular text-[#0A0B0D] text-[16px] leading-[1.2] opacity-50">
                                Get inspired, find that one lesson, advice,
                                recipe, or idea you've been looking for in the
                                span of a coffee break.
                            </p>
                        </div>
                        <div className="order-first aspect-square w-full overflow-hidden rounded-2xl bg-stone-200 md:order-last">
                            <figure className="overflow-hidden">
                                {/* <Image alt="" height={800} src="" width={800} /> */}
                            </figure>
                        </div>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-[40px]">
                        <div className="flex max-w-[340px] flex-col gap-[12px] py-[20px] md:gap-[16px]">
                            <p className="font-medium text-[#0A0B0D] text-[28px] leading-[1.1] tracking-[-1.28px] lg:text-[32px]">
                                Integrate any social media platform
                            </p>
                            <p className="tracking=[-3%] text-pretty font-medium font-regular text-[#0A0B0D] text-[16px] leading-[1.2] opacity-50">
                                Ditch the endless scrolling and tabbing through
                                multiple platforms to find what you're looking
                                for.
                            </p>
                        </div>
                        <div className="order-first aspect-square w-full overflow-hidden rounded-2xl bg-stone-200 md:order-last">
                            <figure className="overflow-hidden">
                                {/* <Image alt="" height={800} src="" width={800} /> */}
                            </figure>
                        </div>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-[40px]">
                        <div className="flex max-w-[340px] flex-col gap-[12px] py-[20px] md:gap-[16px]">
                            <p className="font-medium text-[#0A0B0D] text-[28px] leading-[1.1] tracking-[-1.28px] lg:text-[32px]">
                                Explore through one centralized feed
                            </p>
                            <p className="tracking=[-3%] text-pretty font-medium font-regular text-[#0A0B0D] text-[16px] leading-[1.2] opacity-50">
                                Streamline the way you consume and reengage with
                                your saved content with a single view.
                            </p>
                        </div>
                        <div className="order-first aspect-square w-full overflow-hidden rounded-2xl bg-stone-200 md:order-last">
                            <figure className="overflow-hidden">
                                {/* <Image alt="" height={800} src="" width={800} /> */}
                            </figure>
                        </div>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-[40px]">
                        <div className="flex max-w-[340px] flex-col gap-[12px] py-[20px] md:gap-[16px]">
                            <p className="font-medium text-[#0A0B0D] text-[28px] leading-[1.1] tracking-[-1.28px] lg:text-[32px]">
                                Stay organized and delete stale bookmarks with
                                ease
                            </p>
                            <p className="tracking=[-3%] text-pretty font-medium font-regular text-[#0A0B0D] text-[16px] leading-[1.2] opacity-50">
                                Import and go from messy bookmarks to organized
                                in minutes, then search, manage or group.
                            </p>
                        </div>
                        <div className="order-first aspect-square w-full overflow-hidden rounded-2xl bg-stone-200 md:order-last">
                            <figure className="overflow-hidden">
                                {/* <Image alt="" height={800} src="" width={800} /> */}
                            </figure>
                        </div>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-[40px]">
                        <div className="flex max-w-[340px] flex-col gap-[12px] py-[20px] md:gap-[16px]">
                            <p className="font-medium text-[#0A0B0D] text-[28px] leading-[1.1] tracking-[-1.28px] lg:text-[32px]">
                                Stop leaving it for later
                            </p>
                            <p className="tracking=[-3%] text-pretty font-medium font-regular text-[#0A0B0D] text-[16px] leading-[1.2] opacity-50">
                                Create more actionable opportunities for
                                yourself by having your most insightful saved
                                content on top of your mind.
                            </p>
                        </div>
                        <div className="order-first aspect-square w-full overflow-hidden rounded-2xl bg-stone-200 md:order-last">
                            <figure className="overflow-hidden">
                                {/* <Image alt="" height={800} src="" width={800} /> */}
                            </figure>
                        </div>
                    </div>
                    <div className="flex w-full items-center gap-4">
                        {INTEGRATIONS.map(({ id, Icon }) => (
                            <Icon className="size-6" key={id} />
                        ))}
                    </div>
                    <footer>
                        <div className="relative mx-auto mt-auto grid h-auto w-full grid-cols-12 gap-x-[min(2.25vw,_32px)] pt-[120px] lg:top-0">
                            <div className="!mb-0 !pb-4 md:!pb-6 lg:!pb-8 relative z-20 col-span-full mx-auto mb-[72px] flex grid w-full grid-cols-12 flex-col gap-6 gap-x-[min(2.25vw,_32px)] lg:mb-20 lg:py-8">
                                <div className="col-span-full flex flex-col gap-4">
                                    <div className="col-span-full flex h-full flex-row gap-6 text-[#0A0B0D] text-[0.8rem] leading-[1.22] tracking-[-3%]">
                                        <a
                                            className="text-base-gray-200 underline"
                                            href="https://wallet.coinbase.com/terms-of-service"
                                            rel="noopener"
                                            target="_blank"
                                        >
                                            <p>Terms of Service</p>
                                        </a>
                                        <a
                                            className="text-base-gray-200 underline"
                                            href="https://wallet.coinbase.com/privacy-policy"
                                            rel="noopener"
                                            target="_blank"
                                        >
                                            <p>Privacy Policy</p>
                                        </a>
                                        <a
                                            className="text-base-gray-200 underline"
                                            href="https://docs.base.org/cookie-policy"
                                            rel="noopener"
                                            target="_blank"
                                        >
                                            <p>Cookie Policy</p>
                                        </a>
                                    </div>
                                </div>
                                <div className="col-span-full flex flex-col items-start justify-between font-sans text-[0.8rem] text-base-gray-200 leading-[1.22] tracking-[-3%]">
                                    <span>
                                        *Coinbase does not intend for the
                                        reward-bearing products described herein
                                        to constitute a securities offering, and
                                        purchasing these products is not the
                                        same as investing in a securities
                                        offering. The rewards rate (up to 3.35 %
                                        APY) is subject to change, set at
                                        Coinbase's discretion, and shown in-app
                                        for eligible users. USDC Rewards on Base
                                        App is rolling out in the U.S. and is
                                        unavailable in the EU or Canada; U.S.
                                        Base App users must link a Coinbase
                                        account to earn. Additional detail may
                                        be found
                                    </span>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </PageShell>
    );
}
