"use server";

import { AccountError } from "@/lib/auth/error";
import { auth } from "@/lib/auth/server";
import { createLogger } from "@/lib/logs/console/logger";
import { prisma } from "@/prisma";
import { headers } from "next/headers";

const log = createLogger("library:soundcloud-likes");
const SOUNDCLOUD_PROVIDER_ID = "soundcloud";
const SOUNDCLOUD_LIKES_LIMIT = 6;

export interface SoundcloudLikeTrack {
    artist: string | null;
    artworkUrl: string | null;
    id: string;
    permalinkUrl: string;
    title: string;
}

export type LatestSoundcloudLikesResult =
    | {
          status: "CONNECTED";
          tracks: SoundcloudLikeTrack[];
      }
    | {
          status: "NOT_CONNECTED";
          tracks: [];
      }
    | {
          message: string;
          status: "ERROR" | "RECONNECT_REQUIRED";
          tracks: [];
      };

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : null;
}

function readString(value: unknown): string | null {
    return typeof value === "string" && value.length > 0 ? value : null;
}

function readTrackId(value: unknown): string | null {
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }
    return null;
}

function parseTrack(candidate: unknown): SoundcloudLikeTrack | null {
    const record = asRecord(candidate);
    if (!record) {
        return null;
    }

    const id = readTrackId(record.id);
    const title = readString(record.title);
    const permalinkUrl = readString(record.permalink_url);
    if (!(id && title && permalinkUrl)) {
        return null;
    }

    const artist = asRecord(record.user);
    return {
        artist: readString(artist?.full_name) ?? readString(artist?.username),
        artworkUrl:
            readString(record.artwork_url) ??
            readString(artist?.avatar_url) ??
            null,
        id,
        permalinkUrl,
        title,
    };
}

function normalizeLikesResponse(payload: unknown): SoundcloudLikeTrack[] {
    const root = asRecord(payload);
    const collection = Array.isArray(root?.collection) ? root.collection : [];

    const tracks: SoundcloudLikeTrack[] = [];
    for (const item of collection) {
        const like = asRecord(item);
        const track = parseTrack(like?.track ?? item);
        if (track) {
            tracks.push(track);
        }
        if (tracks.length >= SOUNDCLOUD_LIKES_LIMIT) {
            break;
        }
    }

    return tracks;
}

async function resolveSoundcloudUserId(
    accessToken: string
): Promise<string | null> {
    const response = await fetch("https://api.soundcloud.com/me", {
        cache: "no-store",
        headers: {
            Accept: "application/json",
            Authorization: `OAuth ${accessToken}`,
        },
    });

    if (!response.ok) {
        return null;
    }

    const data = asRecord(await response.json());
    return readTrackId(data?.id);
}

export async function getLatestSoundcloudLikes(): Promise<LatestSoundcloudLikesResult> {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({
        headers: requestHeaders,
    });

    if (!session?.user?.id) {
        throw new AccountError({
            message: "A user session is required to read SoundCloud likes.",
            operation: "getLatestSoundcloudLikes",
        });
    }

    const account = await prisma.account.findFirst({
        select: {
            accountId: true,
        },
        where: {
            providerId: SOUNDCLOUD_PROVIDER_ID,
            userId: session.user.id,
        },
    });

    if (!account) {
        return {
            status: "NOT_CONNECTED",
            tracks: [],
        };
    }

    const tokenResponse = await auth.api.getAccessToken({
        body: {
            accountId: account.accountId,
            providerId: SOUNDCLOUD_PROVIDER_ID,
        },
        headers: requestHeaders,
    });

    const accessToken = tokenResponse?.accessToken;
    if (!accessToken) {
        return {
            message:
                "Your SoundCloud session expired. Reconnect to load your latest likes.",
            status: "RECONNECT_REQUIRED",
            tracks: [],
        };
    }

    const userId =
        account.accountId.length > 0
            ? account.accountId
            : await resolveSoundcloudUserId(accessToken);

    if (!userId) {
        return {
            message:
                "We couldn't resolve your SoundCloud profile. Reconnect and try again.",
            status: "RECONNECT_REQUIRED",
            tracks: [],
        };
    }

    try {
        const response = await fetch(
            `https://api.soundcloud.com/users/${encodeURIComponent(userId)}/likes?limit=${SOUNDCLOUD_LIKES_LIMIT}`,
            {
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                    Authorization: `OAuth ${accessToken}`,
                },
            }
        );

        if (response.status === 401) {
            return {
                message:
                    "SoundCloud asked us to reconnect your account before we can read likes again.",
                status: "RECONNECT_REQUIRED",
                tracks: [],
            };
        }

        if (!response.ok) {
            log.warn("SoundCloud likes request failed", {
                status: response.status,
                userId: session.user.id,
            });
            return {
                message:
                    "SoundCloud couldn't return your latest likes right now. Please try again shortly.",
                status: "ERROR",
                tracks: [],
            };
        }

        return {
            status: "CONNECTED",
            tracks: normalizeLikesResponse(await response.json()),
        };
    } catch (error) {
        log.error("Unexpected SoundCloud likes failure", error);
        return {
            message:
                "We hit an unexpected SoundCloud error while loading your latest likes.",
            status: "ERROR",
            tracks: [],
        };
    }
}
