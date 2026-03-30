import { SITE_APP_NAME, SITE_DEFAULT_TITLE } from "@/lib/constants";
import { GTProvider } from "gt-next";
import { getLocales } from "gt-next/server";
import type { Metadata } from "next";
import type * as React from "react";
import { Suspense } from "react";
import { SetHtmlLang } from "./set-html-lang";

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
        title: {
            default: SITE_DEFAULT_TITLE,
            template: `%s | ${SITE_APP_NAME}`,
        },
    };
}

export default function LocaleLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    return (
        <Suspense fallback={null}>
            <LocaleProviders params={params}>{children}</LocaleProviders>
        </Suspense>
    );
}

async function LocaleProviders({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;

    return (
        <GTProvider>
            <SetHtmlLang locale={locale} />
            {children}
        </GTProvider>
    );
}
