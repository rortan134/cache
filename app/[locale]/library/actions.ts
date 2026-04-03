"use server";

import { AccountError } from "@/lib/auth/error";
import { auth } from "@/lib/auth/server";
import { extractNamedErrorMessage } from "@/lib/error";
import { LibraryCollectionError } from "@/lib/library/error";
import type {
    LibraryCollectionSummary,
    LibraryCollectionTag,
} from "@/lib/library/types";
import { createLogger } from "@/lib/logs/console/logger";
import { prisma } from "@/prisma";
import { headers } from "next/headers";
import { z } from "zod";

const log = createLogger("library:actions");
const SOUNDCLOUD_PROVIDER_ID = "soundcloud";
const SOUNDCLOUD_LIKES_LIMIT = 6;
const COLLECTION_NAME_MAX_LENGTH = 64;

const CreateCollectionInputSchema = z.object({
    assignToItemId: z.string().trim().min(1).optional(),
    description: z.string().trim().max(1024).optional(),
    name: z
        .string()
        .trim()
        .min(1, "Enter a collection name.")
        .max(
            COLLECTION_NAME_MAX_LENGTH,
            `Collection names can be up to ${COLLECTION_NAME_MAX_LENGTH} characters.`
        ),
});

const UpdateLibraryItemCollectionsInputSchema = z.object({
    collectionIds: z.array(z.string().trim().min(1)).max(100),
    itemId: z.string().trim().min(1),
});

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

export type DeleteLibraryItemResult =
    | {
          itemId: string;
          status: "DELETED";
      }
    | {
          message: string;
          status: "ERROR" | "NOT_FOUND" | "UNAUTHORIZED";
      };

export type CreateCollectionResult =
    | {
          assignedItemId: string | null;
          collection: LibraryCollectionSummary;
          status: "CREATED";
      }
    | {
          message: string;
          status:
              | "DUPLICATE"
              | "ERROR"
              | "INVALID"
              | "NOT_FOUND"
              | "UNAUTHORIZED";
      };

export type UpdateLibraryItemCollectionsResult =
    | {
          collections: LibraryCollectionTag[];
          itemId: string;
          status: "UPDATED";
      }
    | {
          message: string;
          status: "ERROR" | "INVALID" | "NOT_FOUND" | "UNAUTHORIZED";
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

function normalizeCollectionName(name: string): {
    name: string;
    nameKey: string;
} {
    const normalizedName = name.trim().replace(/\s+/g, " ");
    return {
        name: normalizedName,
        nameKey: normalizedName.toLocaleLowerCase(),
    };
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

export async function deleteLibraryItem(
    itemId: string
): Promise<DeleteLibraryItemResult> {
    const normalizedItemId = itemId.trim();
    if (normalizedItemId.length === 0) {
        return {
            message: "Select a saved item before trying to delete it.",
            status: "ERROR",
        };
    }

    const requestHeaders = await headers();
    const session = await auth.api.getSession({
        headers: requestHeaders,
    });

    if (!session?.user?.id) {
        return {
            message: "Sign in again to manage saved items.",
            status: "UNAUTHORIZED",
        };
    }

    const libraryItemDelegate = prisma.libraryItem as unknown as {
        deleteMany(args: {
            where: {
                id: string;
                userId: string;
            };
        }): Promise<{ count: number }>;
    };

    try {
        const result = await libraryItemDelegate.deleteMany({
            where: {
                id: normalizedItemId,
                userId: session.user.id,
            },
        });

        if (result.count === 0) {
            return {
                message: "This saved item was already removed.",
                status: "NOT_FOUND",
            };
        }

        return {
            itemId: normalizedItemId,
            status: "DELETED",
        };
    } catch (error) {
        log.error("Unexpected library item delete failure", error);
        return {
            message: "We couldn't delete this saved item right now.",
            status: "ERROR",
        };
    }
}

export async function createCollection(input: {
    assignToItemId?: string;
    description?: string;
    name: string;
}): Promise<CreateCollectionResult> {
    const parsed = CreateCollectionInputSchema.safeParse(input);
    if (!parsed.success) {
        return {
            message:
                parsed.error.issues[0]?.message ??
                "Enter a valid collection name.",
            status: "INVALID",
        };
    }

    const requestHeaders = await headers();
    const session = await auth.api.getSession({
        headers: requestHeaders,
    });

    if (!session?.user?.id) {
        return {
            message: "Sign in again to create collections.",
            status: "UNAUTHORIZED",
        };
    }

    const { assignToItemId, description } = parsed.data;
    const normalized = normalizeCollectionName(parsed.data.name);

    try {
        const result = await prisma.$transaction(async (tx) => {
            if (assignToItemId) {
                const item = await tx.libraryItem.findFirst({
                    select: {
                        id: true,
                    },
                    where: {
                        id: assignToItemId,
                        userId: session.user.id,
                    },
                });

                if (!item) {
                    throw new LibraryCollectionError({
                        code: "not_found",
                        message: "We couldn't find that saved item to tag it.",
                        operation: "createCollection",
                    });
                }
            }

            const existingCollection = await tx.collection.findFirst({
                select: {
                    id: true,
                },
                where: {
                    nameKey: normalized.nameKey,
                    userId: session.user.id,
                },
            });

            if (existingCollection) {
                throw new LibraryCollectionError({
                    code: "duplicate_name",
                    message: "A collection with that name already exists.",
                    operation: "createCollection",
                });
            }

            const collection = await tx.collection.create({
                data: {
                    description,
                    items: assignToItemId
                        ? {
                              connect: {
                                  id: assignToItemId,
                              },
                          }
                        : undefined,
                    name: normalized.name,
                    nameKey: normalized.nameKey,
                    userId: session.user.id,
                },
                select: {
                    description: true,
                    id: true,
                    name: true,
                },
            });

            return {
                assignedItemId: assignToItemId ?? null,
                collection: {
                    description: collection.description,
                    id: collection.id,
                    itemCount: assignToItemId ? 1 : 0,
                    name: collection.name,
                } satisfies LibraryCollectionSummary,
            };
        });

        return {
            assignedItemId: result.assignedItemId,
            collection: result.collection,
            status: "CREATED",
        };
    } catch (error) {
        const named = extractNamedErrorMessage(error);
        if (
            LibraryCollectionError.isInstance(error) &&
            error.data.code === "duplicate_name"
        ) {
            return {
                message: named.message,
                status: "DUPLICATE",
            };
        }
        if (
            LibraryCollectionError.isInstance(error) &&
            error.data.code === "not_found"
        ) {
            return {
                message: named.message,
                status: "NOT_FOUND",
            };
        }

        log.error("Unexpected collection create failure", error);
        return {
            message: "We couldn't create this collection right now.",
            status: "ERROR",
        };
    }
}

export async function updateLibraryItemCollections(input: {
    collectionIds: string[];
    itemId: string;
}): Promise<UpdateLibraryItemCollectionsResult> {
    const parsed = UpdateLibraryItemCollectionsInputSchema.safeParse({
        collectionIds: Array.from(new Set(input.collectionIds)),
        itemId: input.itemId,
    });

    if (!parsed.success) {
        return {
            message: "Pick valid collections before saving.",
            status: "INVALID",
        };
    }

    const requestHeaders = await headers();
    const session = await auth.api.getSession({
        headers: requestHeaders,
    });

    if (!session?.user?.id) {
        return {
            message: "Sign in again to manage collections.",
            status: "UNAUTHORIZED",
        };
    }

    try {
        const item = await prisma.libraryItem.findFirst({
            select: {
                id: true,
            },
            where: {
                id: parsed.data.itemId,
                userId: session.user.id,
            },
        });

        if (!item) {
            return {
                message: "We couldn't find that saved item.",
                status: "NOT_FOUND",
            };
        }

        const ownedCollections = parsed.data.collectionIds.length
            ? await prisma.collection.findMany({
                  orderBy: {
                      name: "asc",
                  },
                  select: {
                      description: true,
                      id: true,
                      name: true,
                  },
                  where: {
                      id: {
                          in: parsed.data.collectionIds,
                      },
                      userId: session.user.id,
                  },
              })
            : [];

        if (ownedCollections.length !== parsed.data.collectionIds.length) {
            return {
                message: "One of those collections is no longer available.",
                status: "NOT_FOUND",
            };
        }

        const updatedItem = await prisma.libraryItem.update({
            data: {
                collections: {
                    set: ownedCollections.map((collection) => ({
                        id: collection.id,
                    })),
                },
            },
            select: {
                collections: {
                    orderBy: {
                        name: "asc",
                    },
                    select: {
                        description: true,
                        id: true,
                        name: true,
                    },
                },
                id: true,
            },
            where: {
                id: parsed.data.itemId,
            },
        });

        return {
            collections: updatedItem.collections,
            itemId: updatedItem.id,
            status: "UPDATED",
        };
    } catch (error) {
        log.error("Unexpected library collection update failure", error);
        return {
            message: "We couldn't update collections for this item.",
            status: "ERROR",
        };
    }
}
