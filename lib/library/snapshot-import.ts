import "server-only";

import { DEFAULT_BROWSER_PROFILE_ID } from "@/lib/library/chrome-bookmarks";
import type { LibraryItemSource } from "@/prisma/client/enums";
import { prisma } from "@/prisma";

interface SnapshotImportRow {
    readonly browserProfileId: string;
    readonly caption: string | null;
    readonly externalId: string;
    readonly kind: "bookmark" | "folder";
    readonly parentExternalId: string | null;
    readonly postedAt: Date | null;
    readonly scrapedAt: Date | null;
    readonly source: LibraryItemSource;
    readonly sourceDeviceId: string | null;
    readonly sourceDeviceName: string | null;
    readonly sourceMetadata: Record<string, unknown> | null;
    readonly thumbnailUrl: string | null;
    readonly url: string;
}

export interface SnapshotImportItemInput {
    readonly browserProfileId?: string;
    readonly caption?: string | null;
    readonly externalId?: string | null;
    readonly kind?: "bookmark" | "folder";
    readonly parentExternalId?: string | null;
    readonly postedAt?: Date | null;
    readonly scrapedAt?: Date | null;
    readonly sourceDeviceId?: string | null;
    readonly sourceDeviceName?: string | null;
    readonly sourceMetadata?: Record<string, unknown> | null;
    readonly thumbnailUrl?: string | null;
    readonly url: string;
}

export interface SnapshotImportResult {
    readonly importedCount: number;
    readonly prunedCount: number;
    readonly skippedCount: number;
    readonly updatedCount: number;
}

interface ExistingLibraryItem {
    readonly externalId: string;
    readonly id: string;
}

interface LibraryItemDelegate {
    deleteMany(args: {
        where: {
            browserProfileId: string;
            externalId?: { in?: string[]; notIn?: string[] };
            source: LibraryItemSource;
            userId: string;
        };
    }): Promise<{ count: number }>;
    findMany(args: {
        select: { externalId: true; id: true };
        where: {
            browserProfileId: string;
            source: LibraryItemSource;
            userId: string;
        };
    }): Promise<ExistingLibraryItem[]>;
    upsert(args: {
        create: SnapshotImportRow & { userId: string };
        update: Omit<SnapshotImportRow, "externalId" | "source">;
        where: {
            userId_source_browserProfileId_externalId: {
                browserProfileId: string;
                externalId: string;
                source: LibraryItemSource;
                userId: string;
            };
        };
    }): Promise<unknown>;
}

function normalizeSnapshotRow(
    source: LibraryItemSource,
    item: SnapshotImportItemInput
): SnapshotImportRow | null {
    const externalId = item.externalId?.trim();
    if (!externalId) {
        return null;
    }

    return {
        browserProfileId:
            item.browserProfileId?.trim() || DEFAULT_BROWSER_PROFILE_ID,
        caption: item.caption?.trim() || null,
        externalId,
        kind: item.kind === "folder" ? "folder" : "bookmark",
        parentExternalId: item.parentExternalId ?? null,
        postedAt: item.postedAt ?? null,
        scrapedAt: item.scrapedAt ?? null,
        source,
        sourceDeviceId: item.sourceDeviceId ?? null,
        sourceDeviceName: item.sourceDeviceName ?? null,
        sourceMetadata: item.sourceMetadata ?? null,
        thumbnailUrl: item.thumbnailUrl ?? null,
        url: item.url,
    };
}

function groupRowsByProfile(rows: readonly SnapshotImportRow[]) {
    const grouped = new Map<string, Map<string, SnapshotImportRow>>();

    for (const row of rows) {
        const rowsByExternalId =
            grouped.get(row.browserProfileId) ??
            new Map<string, SnapshotImportRow>();
        rowsByExternalId.set(row.externalId, row);
        grouped.set(row.browserProfileId, rowsByExternalId);
    }

    return grouped;
}

export async function importLibraryItemSnapshot(args: {
    readonly browserProfileIdsToSync?: readonly string[];
    readonly items: readonly SnapshotImportItemInput[];
    readonly snapshotComplete: boolean;
    readonly source: LibraryItemSource;
    readonly userId: string;
}): Promise<SnapshotImportResult> {
    const normalizedRows = args.items
        .map((item) => normalizeSnapshotRow(args.source, item))
        .filter((item): item is SnapshotImportRow => item !== null);
    const skippedCount = args.items.length - normalizedRows.length;
    const rowsByProfile = groupRowsByProfile(normalizedRows);
    const browserProfileIdsToSync = new Set(
        args.browserProfileIdsToSync?.length
            ? args.browserProfileIdsToSync
            : [DEFAULT_BROWSER_PROFILE_ID]
    );
    for (const browserProfileId of rowsByProfile.keys()) {
        browserProfileIdsToSync.add(browserProfileId);
    }

    let importedCount = 0;
    let updatedCount = 0;
    let prunedCount = 0;

    await prisma.$transaction(async (tx) => {
        const libraryItemDelegate =
            tx.libraryItem as unknown as LibraryItemDelegate;

        for (const browserProfileId of browserProfileIdsToSync) {
            const rows = [
                ...(rowsByProfile.get(browserProfileId)?.values() ?? []),
            ];
            const existingRows = await libraryItemDelegate.findMany({
                select: { externalId: true, id: true },
                where: {
                    browserProfileId,
                    source: args.source,
                    userId: args.userId,
                },
            });
            const existingExternalIds = new Set(
                existingRows.map((row) => row.externalId)
            );

            for (const row of rows) {
                if (existingExternalIds.has(row.externalId)) {
                    updatedCount += 1;
                } else {
                    importedCount += 1;
                }

                await libraryItemDelegate.upsert({
                    create: {
                        ...row,
                        userId: args.userId,
                    },
                    update: {
                        browserProfileId: row.browserProfileId,
                        caption: row.caption,
                        kind: row.kind,
                        parentExternalId: row.parentExternalId,
                        postedAt: row.postedAt,
                        scrapedAt: row.scrapedAt,
                        sourceDeviceId: row.sourceDeviceId,
                        sourceDeviceName: row.sourceDeviceName,
                        sourceMetadata: row.sourceMetadata,
                        thumbnailUrl: row.thumbnailUrl,
                        url: row.url,
                    },
                    where: {
                        userId_source_browserProfileId_externalId: {
                            browserProfileId: row.browserProfileId,
                            externalId: row.externalId,
                            source: args.source,
                            userId: args.userId,
                        },
                    },
                });
            }

            if (!args.snapshotComplete) {
                continue;
            }

            const retainedExternalIds = rows.map((row) => row.externalId);
            const deleteResult = await libraryItemDelegate.deleteMany({
                where: {
                    browserProfileId,
                    ...(retainedExternalIds.length > 0
                        ? {
                              externalId: {
                                  notIn: retainedExternalIds,
                              },
                          }
                        : {}),
                    source: args.source,
                    userId: args.userId,
                },
            });

            prunedCount += deleteResult.count;
        }
    });

    return {
        importedCount,
        prunedCount,
        skippedCount,
        updatedCount,
    };
}
