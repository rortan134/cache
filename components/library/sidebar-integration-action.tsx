"use client";

import { GooglePhotosImportButton } from "@/components/library/google-photos-import-button";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import {
    CACHE_EXTENSION_DOWNLOAD_URL,
    CACHE_EXTENSION_READY_EVENT,
} from "@/lib/constants";
import type { IntegrationId } from "@/lib/integrations/supports";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type SidebarIntegrationActionProps = Readonly<{
    connected: boolean;
    id: IntegrationId;
    locale: string;
    soundcloudParked?: boolean;
}>;

type ExtensionIntegrationId = Extract<
    IntegrationId,
    "chrome" | "instagram" | "tiktok"
>;
type OAuthIntegrationId = Extract<
    IntegrationId,
    "google-photos" | "pinterest" | "soundcloud"
>;

const EXTENSION_OPEN_URL: Record<ExtensionIntegrationId, string> = {
    chrome: CACHE_EXTENSION_DOWNLOAD_URL,
    instagram: "https://www.instagram.com/explore/saved/",
    tiktok: "https://www.tiktok.com/profile",
};

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

function openExternal(url: string) {
    try {
        if (typeof window.openai !== "undefined") {
            window.openai.openExternal({ href: url });
            return;
        }
    } catch {
        // Fall back to a normal browser navigation when the desktop bridge is unavailable.
    }

    window.location.assign(url);
}

function isExtensionInstalled() {
    return document.documentElement.dataset.cacheExtensionInstalled === "true";
}

function isExtensionIntegration(
    id: IntegrationId
): id is ExtensionIntegrationId {
    return id === "chrome" || id === "instagram" || id === "tiktok";
}

function isOAuthIntegration(id: IntegrationId): id is OAuthIntegrationId {
    return id === "google-photos" || id === "pinterest" || id === "soundcloud";
}

function providerIdForIntegration(id: OAuthIntegrationId) {
    if (id === "google-photos") {
        return "google";
    }
    return id;
}

function extensionButtonLabel(extensionInstalled: boolean) {
    if (extensionInstalled) {
        return "Open";
    }
    return "Get Extension";
}

function chromeExtensionLabel(extensionInstalled: boolean) {
    if (extensionInstalled) {
        return "Installed";
    }
    return "Get Extension";
}

export function SidebarIntegrationAction({
    connected,
    id,
    locale,
    soundcloudParked = false,
}: SidebarIntegrationActionProps) {
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isImportingPinterest, setIsImportingPinterest] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [extensionInstalled, setExtensionInstalled] = useState(false);
    const isChromeIntegration = id === "chrome";
    const isGooglePhotosIntegration = id === "google-photos";
    const isPinterestIntegration = id === "pinterest";

    useEffect(() => {
        const handleReady = () => {
            setExtensionInstalled(true);
        };

        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) {
                return;
            }

            const payload = asRecord(event.data);
            if (payload?.type === CACHE_EXTENSION_READY_EVENT) {
                handleReady();
            }
        };

        setExtensionInstalled(isExtensionInstalled());
        window.addEventListener(
            CACHE_EXTENSION_READY_EVENT,
            handleReady as EventListener
        );
        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener(
                CACHE_EXTENSION_READY_EVENT,
                handleReady as EventListener
            );
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    const handleExtensionClick = useCallback(() => {
        if (!isExtensionIntegration(id)) {
            return;
        }

        setErrorMessage(null);
        setSuccessMessage(null);
        if (id === "chrome") {
            if (extensionInstalled) {
                return;
            }
            openExternal(CACHE_EXTENSION_DOWNLOAD_URL);
            return;
        }

        openExternal(
            extensionInstalled
                ? EXTENSION_OPEN_URL[id]
                : CACHE_EXTENSION_DOWNLOAD_URL
        );
    }, [extensionInstalled, id]);

    const handleChromePurge = useCallback(async () => {
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsConnecting(true);

        try {
            const response = await fetch("/api/sync/bookmarks/chrome", {
                method: "DELETE",
            });
            const payload = (await response.json()) as
                | { ok: true; purged: number }
                | { error: string };

            if (!(response.ok && "ok" in payload)) {
                throw new Error(
                    "error" in payload
                        ? payload.error
                        : "Could not purge Chrome bookmarks right now."
                );
            }

            setSuccessMessage(
                `Purged ${payload.purged} Chrome item${payload.purged === 1 ? "" : "s"} from Cache.`
            );
            router.refresh();
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Could not purge Chrome bookmarks right now."
            );
        } finally {
            setIsConnecting(false);
        }
    }, [router]);

    const handleGoogleConnect = useCallback(async () => {
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsConnecting(true);

        try {
            const result = await authClient.signIn.social({
                callbackURL: `/${locale}/library`,
                errorCallbackURL: `/${locale}/library`,
                provider: "google",
            });

            if (result.error) {
                setErrorMessage(
                    result.error.message ??
                        "Could not start the Google connection flow."
                );
            }
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Could not start the Google connection flow."
            );
        } finally {
            setIsConnecting(false);
        }
    }, [locale]);

    const handleGenericOAuthConnect = useCallback(async () => {
        if (!isOAuthIntegration(id) || id === "google-photos") {
            return;
        }

        setErrorMessage(null);
        setSuccessMessage(null);
        setIsConnecting(true);

        try {
            const response = await authClient.$fetch("/oauth2/link", {
                body: {
                    callbackURL: `/${locale}/library`,
                    disableRedirect: true,
                    errorCallbackURL: `/${locale}/library`,
                    providerId: providerIdForIntegration(id),
                },
                method: "POST",
            });

            const redirectUrl = readRedirectUrl(response);
            if (!redirectUrl) {
                setErrorMessage("Could not start the account connection flow.");
                return;
            }

            window.location.assign(redirectUrl);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Could not start the account connection flow."
            );
        } finally {
            setIsConnecting(false);
        }
    }, [id, locale]);

    const handlePinterestImport = useCallback(async () => {
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsImportingPinterest(true);

        try {
            const response = await fetch("/api/pinterest/import", {
                method: "POST",
            });
            const payload = (await response.json()) as
                | {
                      boardsCount: number;
                      error?: string;
                      importedCount: number;
                      skippedCount: number;
                  }
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
            setIsImportingPinterest(false);
        }
    }, [router]);

    if (isExtensionIntegration(id)) {
        const extensionLabel = isChromeIntegration
            ? chromeExtensionLabel(extensionInstalled)
            : extensionButtonLabel(extensionInstalled);

        return (
            <div className="ml-auto flex flex-col items-start gap-1">
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        disabled={id === "chrome" && extensionInstalled}
                        loading={id === "chrome" && isConnecting}
                        onClick={handleExtensionClick}
                        size="sm"
                        type="button"
                        variant="ghost"
                    >
                        {extensionLabel}
                    </Button>
                    {isChromeIntegration && connected ? (
                        <Button
                            loading={isConnecting}
                            onClick={handleChromePurge}
                            size="sm"
                            type="button"
                            variant="outline"
                        >
                            Disconnect
                        </Button>
                    ) : null}
                </div>
            </div>
        );
    }

    const connectLabel = connected ? "Reconnect" : "Connect";
    const isParkedSoundcloud = id === "soundcloud" && soundcloudParked;

    return (
        <div className="ml-auto flex flex-col items-start gap-1">
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    disabled={isParkedSoundcloud}
                    loading={isConnecting}
                    onClick={
                        isGooglePhotosIntegration
                            ? handleGoogleConnect
                            : handleGenericOAuthConnect
                    }
                    size="sm"
                    type="button"
                    variant="ghost"
                >
                    {isParkedSoundcloud ? "Pending" : connectLabel}
                </Button>
                {isGooglePhotosIntegration && connected ? (
                    <GooglePhotosImportButton
                        locale={locale}
                        variant="outline"
                    />
                ) : null}
                {isPinterestIntegration && connected ? (
                    <Button
                        loading={isImportingPinterest}
                        onClick={handlePinterestImport}
                        size="icon"
                        type="button"
                        variant="outline"
                    >
                        <RefreshCw className="size-4" />
                    </Button>
                ) : null}
            </div>
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
