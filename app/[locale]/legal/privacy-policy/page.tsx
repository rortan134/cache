import { SITE_APP_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
    description: `Privacy Policy for ${SITE_APP_NAME}.`,
    title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
    return (
        <article className="flex flex-col gap-4 text-stone-800">
            <h1 className="font-semibold text-2xl text-stone-950 tracking-tight">
                Privacy Policy
            </h1>
            <p className="text-[0.95rem] leading-relaxed">
                Placeholder content. Final privacy policy will be published
                here.
            </p>
        </article>
    );
}
