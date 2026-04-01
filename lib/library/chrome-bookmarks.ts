import "server-only";

import { createLogger } from "@/lib/logs/console/logger";
import { LibraryItemSource } from "@/prisma/client/enums";
import { prisma } from "@/prisma";
import * as z from "zod";

const log = createLogger("library:chrome-bookmarks");

export const DEFAULT_BROWSER_PROFILE_ID = "default";
const CHROME_FOLDER_URL_PREFIX = "cache://chrome-bookmarks/folder/";

const chromeBookmarkNodeSchema = z.object({
    dateAdded: z.number().int().nonnegative().optional(),
    dateGroupModified: z.number().int().nonnegative().optional(),
    externalId: z.string().min(1),
    index: z.number().int().nonnegative().optional(),
    kind: z.enum(["bookmark", "folder"]),
    parentExternalId: z.string().min(1).optional(),
    title: z.string().optional(),
    url: z.string().url().optional(),
});

const chromeBookmarkEventSchema = z
    .object({
        bookmark: chromeBookmarkNodeSchema.optional(),
        externalId: z.string().min(1).optional(),
        occurredAt: z.string().optional(),
        snapshotExternalIds: z.array(z.string().min(1)).optional(),
        type: z.enum(["delete", "import_complete", "move", "upsert"]),
    })
    .superRefine((value, ctx) => {
        if (
            (value.type === "upsert" || value.type === "move") &&
            !value.bookmark
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "bookmark is required for upsert and move events",
                path: ["bookmark"],
            });
        }
        if (value.type === "delete" && !value.externalId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "externalId is required for delete events",
                path: ["externalId"],
            });
        }
        if (
            value.type === "import_complete" &&
            (!value.snapshotExternalIds ||
                value.snapshotExternalIds.length === 0)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "snapshotExternalIds is required for import_complete events",
                path: ["snapshotExternalIds"],
            });
        }
    });

export const chromeBookmarkSyncBodySchema = z.object({
    browserProfileId: z.string().min(1).default(DEFAULT_BROWSER_PROFILE_ID),
    device: z
        .object({
            id: z.string().min(1),
            name: z.string().optional(),
            os: z.string().optional(),
        })
        .optional(),
    events: z.array(chromeBookmarkEventSchema).min(1),
    mode: z
        .enum(["continuous_sync", "one_time_import"])
        .default("continuous_sync"),
    syncedAt: z.string().optional(),
});

export type ChromeBookmarkSyncBody = z.infer<
    typeof chromeBookmarkSyncBodySchema
>;

type ChromeItemKind = "bookmark" | "folder";

interface ChromeBookmarkRecord {
    readonly browserProfileId: string;
    readonly caption: string | null;
    readonly externalId: string;
    readonly kind: ChromeItemKind;
    readonly parentExternalId: string | null;
    readonly postedAt: Date | null;
    readonly scrapedAt: Date;
    readonly source: typeof LibraryItemSource.chrome_bookmarks;
    readonly sourceDeviceId: string | null;
    readonly sourceDeviceName: string | null;
    readonly sourceMetadata: Record<string, unknown>;
    readonly thumbnailUrl: null;
    readonly url: string;
}

interface ChromeLibraryRow extends ChromeBookmarkRecord {
    readonly id: string;
    readonly sourceAliasIds: string[];
}

interface ChromeLibraryItemDelegate {
    create(args: {
        data: ChromeBookmarkRecord & {
            user: {
                connect: {
                    id: string;
                };
            };
        };
    }): Promise<unknown>;
    delete(args: { where: { id: string } }): Promise<unknown>;
    deleteMany(args: {
        where: {
            source: typeof LibraryItemSource.chrome_bookmarks;
            userId: string;
        };
    }): Promise<{ count: number }>;
    findFirst(args: {
        orderBy?: { updatedAt: "desc" };
        select?: {
            externalId?: true;
            id?: true;
            sourceAliasIds?: true;
        };
        take?: number;
        where: Record<string, unknown>;
    }): Promise<ChromeLibraryRow | null>;
    findMany(args: {
        orderBy?: { updatedAt: "desc" };
        select?: {
            externalId?: true;
            id?: true;
            sourceAliasIds?: true;
        };
        take?: number;
        where: Record<string, unknown>;
    }): Promise<ChromeLibraryRow[]>;
    findUnique(args: {
        where: {
            userId_source_browserProfileId_externalId: {
                browserProfileId: string;
                externalId: string;
                source: typeof LibraryItemSource.chrome_bookmarks;
                userId: string;
            };
        };
    }): Promise<ChromeLibraryRow | null>;
    update(args: {
        data: Partial<ChromeBookmarkRecord> & {
            externalId?: string;
            sourceAliasIds?: string[];
        };
        where: { id: string };
    }): Promise<ChromeLibraryRow>;
}

function chromeLibraryItemDelegate(candidate: {
    libraryItem: unknown;
}): ChromeLibraryItemDelegate {
    return candidate.libraryItem as ChromeLibraryItemDelegate;
}

interface ChromeSyncResult {
    readonly deduped: number;
    readonly deleted: number;
    readonly processed: number;
    readonly pruned: number;
    readonly upserted: number;
}

function normalizeChromeCaption(value: string | null | undefined): string {
    return (value ?? "")
        .trim()
        .toLocaleLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ");
}

function chromeFolderUrl(browserProfileId: string, externalId: string): string {
    return `${CHROME_FOLDER_URL_PREFIX}${encodeURIComponent(browserProfileId)}/${encodeURIComponent(externalId)}`;
}

function parseChromeTimestamp(value: string | undefined): Date | null {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeChromeBookmarkRecord(
    browserProfileId: string,
    bookmark: z.infer<typeof chromeBookmarkNodeSchema>,
    occurredAt: string | undefined,
    device: ChromeBookmarkSyncBody["device"]
): ChromeBookmarkRecord {
    const title = bookmark.title?.trim();
    const metadata = {
        chrome: {
            dateAdded: bookmark.dateAdded ?? null,
            dateGroupModified: bookmark.dateGroupModified ?? null,
            index: bookmark.index ?? null,
        },
        device: device
            ? {
                  id: device.id,
                  name: device.name ?? null,
                  os: device.os ?? null,
              }
            : null,
    };

    return {
        browserProfileId,
        caption: title && title.length > 0 ? title : null,
        externalId: bookmark.externalId,
        kind: bookmark.kind === "folder" ? "folder" : "bookmark",
        parentExternalId: bookmark.parentExternalId ?? null,
        postedAt:
            typeof bookmark.dateAdded === "number"
                ? new Date(bookmark.dateAdded)
                : null,
        scrapedAt: parseChromeTimestamp(occurredAt) ?? new Date(),
        source: LibraryItemSource.chrome_bookmarks,
        sourceDeviceId: device?.id ?? null,
        sourceDeviceName: device?.name ?? null,
        sourceMetadata: metadata,
        thumbnailUrl: null,
        url:
            bookmark.kind === "folder"
                ? chromeFolderUrl(browserProfileId, bookmark.externalId)
                : (bookmark.url ??
                  chromeFolderUrl(browserProfileId, bookmark.externalId)),
    };
}

function findChromeByAlias(
    tx: { libraryItem: unknown },
    userId: string,
    browserProfileId: string,
    externalId: string
) {
    return chromeLibraryItemDelegate(tx).findFirst({
        where: {
            browserProfileId,
            source: LibraryItemSource.chrome_bookmarks,
            sourceAliasIds: {
                has: externalId,
            },
            userId,
        },
    });
}

function promoteAliasToPrimary(
    tx: { libraryItem: unknown },
    row: Awaited<ReturnType<typeof findChromeByAlias>>,
    externalId: string
) {
    if (!row) {
        return null;
    }

    const aliasIds = new Set(row.sourceAliasIds);
    aliasIds.delete(externalId);
    aliasIds.add(row.externalId);

    return chromeLibraryItemDelegate(tx).update({
        data: {
            externalId,
            sourceAliasIds: [...aliasIds],
        },
        where: { id: row.id },
    });
}

async function findChromeLogicalDuplicate(
    tx: { libraryItem: unknown },
    userId: string,
    browserProfileId: string,
    record: ReturnType<typeof normalizeChromeBookmarkRecord>
) {
    if (record.kind !== "bookmark") {
        return null;
    }

    const candidates = await chromeLibraryItemDelegate(tx).findMany({
        orderBy: { updatedAt: "desc" },
        take: 12,
        where: {
            browserProfileId,
            kind: "bookmark",
            source: LibraryItemSource.chrome_bookmarks,
            url: record.url,
            userId,
        },
    });

    const normalizedIncomingCaption = normalizeChromeCaption(record.caption);
    return (
        candidates.find(
            (candidate) =>
                normalizeChromeCaption(candidate.caption) ===
                normalizedIncomingCaption
        ) ?? null
    );
}

async function upsertChromeBookmarkEvent(
    tx: { libraryItem: unknown },
    userId: string,
    browserProfileId: string,
    bookmark: z.infer<typeof chromeBookmarkNodeSchema>,
    occurredAt: string | undefined,
    device: ChromeBookmarkSyncBody["device"]
): Promise<{ deduped: boolean }> {
    const record = normalizeChromeBookmarkRecord(
        browserProfileId,
        bookmark,
        occurredAt,
        device
    );

    const delegate = chromeLibraryItemDelegate(tx);
    const exact = await delegate.findUnique({
        where: {
            userId_source_browserProfileId_externalId: {
                browserProfileId,
                externalId: record.externalId,
                source: LibraryItemSource.chrome_bookmarks,
                userId,
            },
        },
    });

    if (exact) {
        await delegate.update({
            data: {
                caption: record.caption,
                kind: record.kind,
                parentExternalId: record.parentExternalId,
                postedAt: record.postedAt,
                scrapedAt: record.scrapedAt,
                sourceDeviceId: record.sourceDeviceId,
                sourceDeviceName: record.sourceDeviceName,
                sourceMetadata: record.sourceMetadata,
                url: record.url,
            },
            where: { id: exact.id },
        });
        return { deduped: false };
    }

    const aliasMatch = await findChromeByAlias(
        tx,
        userId,
        browserProfileId,
        record.externalId
    );
    if (aliasMatch) {
        const promoted = await promoteAliasToPrimary(
            tx,
            aliasMatch,
            record.externalId
        );
        if (promoted) {
            await delegate.update({
                data: {
                    caption: record.caption,
                    kind: record.kind,
                    parentExternalId: record.parentExternalId,
                    postedAt: record.postedAt,
                    scrapedAt: record.scrapedAt,
                    sourceDeviceId: record.sourceDeviceId,
                    sourceDeviceName: record.sourceDeviceName,
                    sourceMetadata: record.sourceMetadata,
                    url: record.url,
                },
                where: { id: promoted.id },
            });
        }
        return { deduped: false };
    }

    const duplicate = await findChromeLogicalDuplicate(
        tx,
        userId,
        browserProfileId,
        record
    );
    if (duplicate) {
        const aliasIds = new Set(duplicate.sourceAliasIds);
        if (duplicate.externalId !== record.externalId) {
            aliasIds.add(record.externalId);
        }
        await delegate.update({
            data: {
                caption: record.caption,
                parentExternalId: record.parentExternalId,
                postedAt: record.postedAt,
                scrapedAt: record.scrapedAt,
                sourceAliasIds: [...aliasIds],
                sourceDeviceId: record.sourceDeviceId,
                sourceDeviceName: record.sourceDeviceName,
                sourceMetadata: record.sourceMetadata,
                url: record.url,
            },
            where: { id: duplicate.id },
        });
        return { deduped: true };
    }

    await delegate.create({
        data: {
            ...record,
            user: {
                connect: { id: userId },
            },
        },
    });
    return { deduped: false };
}

async function deleteChromeBookmarkEvent(
    tx: { libraryItem: unknown },
    userId: string,
    browserProfileId: string,
    externalId: string
): Promise<boolean> {
    const delegate = chromeLibraryItemDelegate(tx);
    const exact = await delegate.findUnique({
        where: {
            userId_source_browserProfileId_externalId: {
                browserProfileId,
                externalId,
                source: LibraryItemSource.chrome_bookmarks,
                userId,
            },
        },
    });

    if (exact) {
        if (exact.sourceAliasIds.length > 0) {
            const [nextPrimary, ...remainingAliases] = exact.sourceAliasIds;
            await delegate.update({
                data: {
                    externalId: nextPrimary,
                    sourceAliasIds: remainingAliases,
                },
                where: { id: exact.id },
            });
        } else {
            await delegate.delete({
                where: { id: exact.id },
            });
        }
        return true;
    }

    const aliasMatch = await findChromeByAlias(
        tx,
        userId,
        browserProfileId,
        externalId
    );
    if (!aliasMatch) {
        return false;
    }

    await delegate.update({
        data: {
            sourceAliasIds: aliasMatch.sourceAliasIds.filter(
                (value) => value !== externalId
            ),
        },
        where: { id: aliasMatch.id },
    });
    return true;
}

async function pruneChromeSnapshot(
    tx: { libraryItem: unknown },
    userId: string,
    browserProfileId: string,
    snapshotExternalIds: readonly string[]
): Promise<number> {
    const seen = new Set(snapshotExternalIds);
    const delegate = chromeLibraryItemDelegate(tx);
    const rows = await delegate.findMany({
        select: {
            externalId: true,
            id: true,
            sourceAliasIds: true,
        },
        where: {
            browserProfileId,
            source: LibraryItemSource.chrome_bookmarks,
            userId,
        },
    });

    let pruned = 0;
    for (const row of rows) {
        if (seen.has(row.externalId)) {
            continue;
        }

        const aliasCandidate = row.sourceAliasIds.find((aliasId) =>
            seen.has(aliasId)
        );
        if (aliasCandidate) {
            await delegate.update({
                data: {
                    externalId: aliasCandidate,
                    sourceAliasIds: [
                        row.externalId,
                        ...row.sourceAliasIds.filter(
                            (aliasId) => aliasId !== aliasCandidate
                        ),
                    ],
                },
                where: { id: row.id },
            });
            continue;
        }

        await delegate.delete({
            where: { id: row.id },
        });
        pruned += 1;
    }

    return pruned;
}

export function applyChromeBookmarkSyncEvents(
    userId: string,
    body: ChromeBookmarkSyncBody
): Promise<ChromeSyncResult> {
    const browserProfileId =
        body.browserProfileId || DEFAULT_BROWSER_PROFILE_ID;

    return prisma.$transaction(async (tx) => {
        let deleted = 0;
        let deduped = 0;
        let pruned = 0;
        let upserted = 0;

        for (const event of body.events) {
            if (event.type === "delete") {
                const removed = await deleteChromeBookmarkEvent(
                    tx,
                    userId,
                    browserProfileId,
                    event.externalId ?? ""
                );
                if (removed) {
                    deleted += 1;
                }
                continue;
            }

            if (event.type === "import_complete") {
                pruned += await pruneChromeSnapshot(
                    tx,
                    userId,
                    browserProfileId,
                    event.snapshotExternalIds ?? []
                );
                continue;
            }

            const bookmark = event.bookmark;
            if (!bookmark) {
                continue;
            }

            const result = await upsertChromeBookmarkEvent(
                tx,
                userId,
                browserProfileId,
                bookmark,
                event.occurredAt,
                body.device
            );
            upserted += 1;
            if (result.deduped) {
                deduped += 1;
            }
        }

        return {
            deduped,
            deleted,
            processed: body.events.length,
            pruned,
            upserted,
        };
    });
}

export async function purgeChromeBookmarksForUser(
    userId: string
): Promise<number> {
    const result = await chromeLibraryItemDelegate(prisma).deleteMany({
        where: {
            source: LibraryItemSource.chrome_bookmarks,
            userId,
        },
    });

    log.info("Purged Chrome bookmarks", {
        count: result.count,
        userId,
    });

    return result.count;
}
