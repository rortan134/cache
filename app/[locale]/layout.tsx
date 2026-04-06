import { OneTapTrigger } from "@/components/auth/session";
import { SITE_APP_NAME } from "@/lib/constants";
import { getLocales } from "gt-next/server";
import type { Metadata } from "next";
import type * as React from "react";
import { Suspense } from "react";

export function generateStaticParams() {
    return getLocales().map((locale) => ({ locale }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    await params;

    return {
        description: SITE_APP_NAME,
    };
}

export default function LocaleLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Suspense fallback={null}>
            <OneTapTrigger />
            {children}
        </Suspense>
    );
}
