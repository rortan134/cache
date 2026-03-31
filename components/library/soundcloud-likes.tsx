"use client";

import { SoundCloud } from "@/components/shared/integration-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/client";
import type {
    LatestSoundcloudLikesResult,
    SoundcloudLikeTrack,
} from "@/app/[locale]/library/actions";
import { ExternalLink, RefreshCw } from "lucide-react";
import type * as React from "react";
import { useCallback, useState } from "react";

interface SoundcloudConnectButtonProps {
    className?: string;
    connected?: boolean;
    locale: string;
    size?: React.ComponentProps<typeof Button>["size"];
    variant?: React.ComponentProps<typeof Button>["variant"];
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

export function SoundcloudConnectButton({
    className,
    connected = false,
    locale,
    size = "sm",
    variant = "ghost",
}: Readonly<SoundcloudConnectButtonProps>) {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleConnect = useCallback(async () => {
        setErrorMessage(null);
        setLoading(true);

        try {
            const response = await authClient.$fetch("/oauth2/link", {
                body: {
                    callbackURL: `/${locale}/library`,
                    disableRedirect: true,
                    errorCallbackURL: `/${locale}/library`,
                    providerId: "soundcloud",
                },
                method: "POST",
            });

            const redirectUrl = readRedirectUrl(response);
            if (!redirectUrl) {
                setErrorMessage(
                    "Could not start the SoundCloud connection flow."
                );
                return;
            }

            window.location.assign(redirectUrl);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Could not start the SoundCloud connection flow."
            );
        } finally {
            setLoading(false);
        }
    }, [locale]);

    return (
        <div className="flex flex-col items-start gap-1">
            <Button
                className={className}
                loading={loading}
                onClick={handleConnect}
                size={size}
                variant={variant}
            >
                {connected ? "Reconnect" : "Connect"}
            </Button>
            {errorMessage ? (
                <p
                    aria-live="polite"
                    className="text-destructive text-xs underline decoration-dotted underline-offset-4"
                    role="alert"
                >
                    {errorMessage}
                </p>
            ) : null}
        </div>
    );
}

function TrackCard({ track }: Readonly<{ track: SoundcloudLikeTrack }>) {
    return (
        <a
            className="group flex min-w-0 gap-3 rounded-xl border border-border/40 bg-card/40 p-3 ring-1 ring-border/30 transition-colors hover:bg-card/70"
            href={track.permalinkUrl}
            rel="noreferrer"
            target="_blank"
        >
            {track.artworkUrl ? (
                <img
                    alt=""
                    className="size-14 rounded-lg object-cover"
                    height={56}
                    loading="lazy"
                    src={track.artworkUrl}
                    width={56}
                />
            ) : (
                <div className="flex size-14 items-center justify-center rounded-lg bg-[#ff5500]/12 text-[#ff5500]">
                    <SoundCloud aria-hidden className="size-7" />
                </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <p className="truncate font-medium text-sm">{track.title}</p>
                <p className="truncate text-muted-foreground text-xs">
                    {track.artist ?? "Unknown artist"}
                </p>
            </div>
            <ExternalLink
                aria-hidden
                className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
        </a>
    );
}

export function SoundcloudLikes({
    locale,
    result,
}: Readonly<{
    locale: string;
    result: LatestSoundcloudLikesResult;
}>) {
    const isConnected = result.status !== "NOT_CONNECTED";
    const isReconnectState = result.status === "RECONNECT_REQUIRED";

    return (
        <section className="flex w-full flex-col gap-4 rounded-[28px] border border-border/40 bg-card/35 p-5 ring-1 ring-border/20 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[#ff5500]/12 text-[#ff5500] ring-1 ring-[#ff5500]/15">
                        <SoundCloud aria-hidden className="size-6" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-medium text-lg">
                            Latest SoundCloud likes
                        </p>
                        <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed">
                            Keep your newest liked tracks in view without
                            importing them into bookmark sync.
                        </p>
                    </div>
                </div>
                <SoundcloudConnectButton
                    connected={isConnected}
                    locale={locale}
                    size="sm"
                    variant={isReconnectState ? "outline" : "ghost"}
                />
            </div>

            {result.status === "NOT_CONNECTED" ? (
                <div className="rounded-2xl border border-border/60 border-dashed bg-background/50 px-4 py-6 text-muted-foreground text-sm">
                    Connect SoundCloud to surface your six latest liked tracks
                    here.
                </div>
            ) : null}

            {result.status === "CONNECTED" && result.tracks.length === 0 ? (
                <div className="rounded-2xl border border-border/60 border-dashed bg-background/50 px-4 py-6 text-muted-foreground text-sm">
                    Your SoundCloud account is connected, but there are no
                    recent liked tracks to show yet.
                </div>
            ) : null}

            {result.status === "CONNECTED" && result.tracks.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {result.tracks.map((track) => (
                        <TrackCard key={track.id} track={track} />
                    ))}
                </div>
            ) : null}

            {result.status === "ERROR" ||
            result.status === "RECONNECT_REQUIRED" ? (
                <div
                    className={cn(
                        "flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm",
                        result.status === "RECONNECT_REQUIRED"
                            ? "border-[#ff5500]/20 bg-[#ff5500]/6 text-foreground"
                            : "border-border/60 bg-background/50 text-muted-foreground"
                    )}
                >
                    <RefreshCw
                        aria-hidden
                        className={cn(
                            "mt-0.5 size-4 shrink-0",
                            result.status === "RECONNECT_REQUIRED"
                                ? "text-[#ff5500]"
                                : "text-muted-foreground"
                        )}
                    />
                    <p>{result.message}</p>
                </div>
            ) : null}
        </section>
    );
}
