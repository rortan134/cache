"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

interface PinterestImportResponse {
    readonly boardsCount: number;
    readonly error?: string;
    readonly importedCount: number;
    readonly skippedCount: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : null;
}

function readRedirectUrl(response: unknown): string | null {
    const root = asRecord(response);
    const payload = asRecord(root?.data) ?? root;
    const url = payload?.url;
    return typeof url === "string" && url.length > 0 ? url : null;
}

export function PinterestImportControls({
    connected,
    importedCount,
    locale,
}: Readonly<{
    connected: boolean;
    importedCount: number;
    locale: string;
}>) {
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    let helperText = "Link your Pinterest account to import saved Pins.";
    if (connected) {
        helperText =
            importedCount > 0
                ? `${importedCount} Pinterest pin${importedCount === 1 ? "" : "s"} already in your library.`
                : "Import your saved Pins into the library.";
    }

    const handleConnect = useCallback(async () => {
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsConnecting(true);

        try {
            const response = await authClient.$fetch("/oauth2/link", {
                body: {
                    callbackURL: `/${locale}/library`,
                    disableRedirect: true,
                    errorCallbackURL: `/${locale}/library`,
                    providerId: "pinterest",
                },
                method: "POST",
            });

            const redirectUrl = readRedirectUrl(response);
            if (!redirectUrl) {
                setErrorMessage(
                    "Could not start the Pinterest connection flow."
                );
                return;
            }

            window.location.assign(redirectUrl);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Could not start the Pinterest connection flow."
            );
        } finally {
            setIsConnecting(false);
        }
    }, [locale]);

    const handleImport = useCallback(async () => {
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsImporting(true);

        try {
            const response = await fetch("/api/pinterest/import", {
                method: "POST",
            });
            const payload = (await response.json()) as
                | PinterestImportResponse
                | { error: string };

            if (!(response.ok && "importedCount" in payload)) {
                throw new Error(
                    payload.error ??
                        "Could not import pins from Pinterest right now."
                );
            }

            setSuccessMessage(
                `Imported ${payload.importedCount} pin${payload.importedCount === 1 ? "" : "s"} from ${payload.boardsCount} board${payload.boardsCount === 1 ? "" : "s"}.`
            );
            router.refresh();
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Could not import pins from Pinterest right now."
            );
        } finally {
            setIsImporting(false);
        }
    }, [router]);

    return (
        <div className="flex flex-col items-start gap-1">
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    loading={connected ? isImporting : isConnecting}
                    onClick={connected ? handleImport : handleConnect}
                    size="sm"
                    variant="ghost"
                >
                    {connected ? "Import Pins" : "Connect"}
                </Button>
                {connected ? (
                    <Button
                        loading={isConnecting}
                        onClick={handleConnect}
                        size="sm"
                        type="button"
                        variant="outline"
                    >
                        <RefreshCw className="size-4" />
                        Reconnect
                    </Button>
                ) : null}
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
                {helperText}
            </p>
            {errorMessage ? (
                <p
                    aria-live="polite"
                    className="text-destructive text-xs underline decoration-dotted underline-offset-4"
                    role="alert"
                >
                    {errorMessage}
                </p>
            ) : null}
            {successMessage ? (
                <p className="text-emerald-600 text-xs" role="status">
                    {successMessage}
                </p>
            ) : null}
        </div>
    );
}
