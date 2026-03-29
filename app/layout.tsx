import "@/lib/dayjs/locales";

import { GTProvider } from "gt-next";
import { getGT, getLocale } from "gt-next/server";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
    const gt = await getGT();

    return {
        description: gt("Cache"),
        title: gt("Cache"),
    };
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();

    return (
        <html className={`${inter.variable} h-full antialiased`} lang={locale}>
            <body className="flex min-h-full flex-col">
                <GTProvider>{children}</GTProvider>
            </body>
        </html>
    );
}
