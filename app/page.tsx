import { PageShell } from "@/components/layouts";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";

export default function Home() {
    return (
        <PageShell>
            <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
                <aside className="flex min-h-full w-full shrink-0 flex-col gap-8 p-8 lg:max-w-[400px] lg:justify-between">
                    {/* Hero section */}
                    <div className="flex w-full flex-col gap-6 lg:sticky lg:top-8">
                        <div className="flex flex-col gap-2 text-balance md:gap-4">
                            <h1 className="text-balance text-[3rem] leading-[92%] md:text-[4.375rem] md:tracking-[-0.21875rem]">
                                Welcome to
                                <br />
                                the Homepage.
                            </h1>
                            <p className="text-[#0A0B0D] text-[1rem] leading-[1.22] tracking-[-3%] opacity-50 lg:max-w-[320px]">
                                This is the homepage of the website.
                            </p>
                        </div>
                        <LiquidMetalButton label="Get Started" />
                    </div>
                </aside>
                <div className="flex w-full max-w-[1024x] flex-col items-center gap-12 p-8 2xl:mx-auto">
                    {/* Main content */}
                </div>
            </div>
        </PageShell>
    );
}
