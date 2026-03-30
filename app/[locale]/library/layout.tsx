import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const DEFAULT_LOCALE = "en-US";

export default async function LibraryLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        const { locale } = await params;
        redirect(`/${locale || DEFAULT_LOCALE}`);
    }

    return <NuqsAdapter>{children}</NuqsAdapter>;
}
