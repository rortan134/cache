import "@/lib/dayjs/locales";

import { GTProvider } from "gt-next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    description: "Cache",
    title: "Cache",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html className={`${inter.variable} h-full antialiased`} lang="en">
            <body className="flex min-h-full flex-col">
                <GTProvider>{children}</GTProvider>
            </body>
        </html>
    );
}
