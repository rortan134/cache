"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth/client";
import { Info } from "lucide-react";
import Link from "next/link";
import type * as React from "react";

const { useSession } = authClient;

function SignedOutOnly({
    children,
    loadingRender,
}: React.PropsWithChildren<{ loadingRender?: React.ReactNode }>) {
    const { data: session, isPending } = useSession();

    if (isPending && typeof loadingRender !== "undefined") {
        return loadingRender;
    }

    if (session) {
        return null;
    }

    return children;
}

function SignedInOnly({
    children,
    loadingRender,
}: React.PropsWithChildren<{ loadingRender?: React.ReactNode }>) {
    const { data: session, isPending } = useSession();

    if (isPending && typeof loadingRender !== "undefined") {
        return loadingRender;
    }

    if (session) {
        return children;
    }

    return null;
}

function SessionLoadingOnly({ children }: React.PropsWithChildren) {
    const { isPending } = useSession();

    if (isPending) {
        return children;
    }

    return null;
}

function SessionHint() {
    const { data: session, isPending } = useSession();

    if (!session) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <Info className="size-4 opacity-50" />
            <p className="font-medium text-xs leading-[1.22] tracking-[-3%] opacity-50">
                You are signed in as{" "}
                {session?.user.email ?? <Skeleton>Placeholder</Skeleton>}
                <Button
                    loading={isPending}
                    render={<Link href="/logout">Log out</Link>}
                    variant="link"
                />
            </p>
        </div>
    );
}

export { SessionHint, SessionLoadingOnly, SignedInOnly, SignedOutOnly };
