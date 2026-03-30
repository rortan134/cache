import { SITE_APP_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
    description: `Terms of Service for ${SITE_APP_NAME}.`,
    title: "Terms of Service",
};

export default function TermsOfServicePage() {
    return (
        <article className="flex flex-col gap-4 text-stone-800">
            <h1 className="font-semibold text-2xl text-stone-950 tracking-tight">
                Terms of Service
            </h1>
            <p className="text-[0.95rem] leading-relaxed">
                Placeholder content. Final terms of service will be published
                here.
            </p>
        </article>
    );
}
