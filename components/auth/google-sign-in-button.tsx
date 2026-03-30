"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { useCallback, useState } from "react";

function GoogleMark() {
    return (
        <svg
            aria-label="Google"
            className="size-[18px] shrink-0 sm:size-4"
            role="img"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                fill="#FFC107"
            />
            <path
                d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                fill="#FF3D00"
            />
            <path
                d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238A11.86 11.86 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                fill="#4CAF50"
            />
            <path
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                fill="#1976D2"
            />
        </svg>
    );
}

export function GoogleSignInButton({
    children = "Continue with Google",
    locale,
}: Readonly<{
    children?: React.ReactNode;
    locale: string;
}>) {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSignIn = useCallback(async () => {
        setErrorMessage(null);
        setLoading(true);
        try {
            const result = await authClient.signIn.social({
                callbackURL: `/${locale}/library`,
                errorCallbackURL: `/${locale}`,
                provider: "google",
            });
            if (result.error) {
                setErrorMessage(
                    result.error.message ?? "Could not start Google sign-in."
                );
            }
        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "Could not start Google sign-in."
            );
        } finally {
            setLoading(false);
        }
    }, [locale]);

    return (
        <div className="flex flex-col gap-1">
            <Button
                aria-label="Continue with Google"
                className="border border-[#747775] bg-white text-[#1f1f1f] shadow-xs hover:bg-[#f8f9fa] dark:border-input dark:bg-popover dark:text-foreground dark:hover:bg-accent/50"
                loading={loading}
                onClick={handleSignIn}
                size="lg"
                type="button"
                variant="outline"
            >
                <GoogleMark />
                {children}
            </Button>
            {errorMessage ? (
                <p
                    aria-live="polite"
                    className="text-destructive text-sm underline decoration-dotted underline-offset-4"
                    role="alert"
                >
                    {errorMessage}
                </p>
            ) : null}
        </div>
    );
}
