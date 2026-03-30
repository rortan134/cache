import { PageShell } from "@/components/layouts";
import type * as React from "react";

export default function LegalLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <PageShell>
            <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
                {children}
            </div>
        </PageShell>
    );
}
