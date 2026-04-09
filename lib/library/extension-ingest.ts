import "server-only";

import { DEFAULT_BROWSER_PROFILE_ID } from "@/lib/library/chrome-bookmarks";
import { LibraryItemSource } from "@/prisma/client/enums";
import { prisma } from "@/prisma";

const CORS_HEADERS = {
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Max-Age": "86400",
} as const;

export function extensionIngestCorsHeaders(): HeadersInit {
    return CORS_HEADERS;
}

export function parseBearerToken(request: Request): string | null {
    const raw = request.headers.get("authorization");
    if (!raw?.startsWith("Bearer ")) {
        return null;
    }
    const t = raw.slice("Bearer ".length).trim();
    return t.length > 0 ? t : null;
}

/**
 * Resolves the Cache user id for an extension ingest Bearer token.
 */
export async function resolveExtensionIngestUserId(
    bearerToken: string
): Promise<string | null> {
    const byToken = await prisma.user.findFirst({
        select: { id: true },
        where: { extensionIngestToken: bearerToken },
    });
    if (byToken) {
        return byToken.id;
    }

    const envToken = process.env.INSTAGRAM_SAVED_INGEST_TOKEN;
    const fallbackUserId = process.env.EXTENSION_FALLBACK_USER_ID;
    if (envToken && fallbackUserId && bearerToken === envToken.trim()) {
        const u = await prisma.user.findUnique({
            select: { id: true },
            where: { id: fallbackUserId },
        });
        return u?.id ?? null;
    }

    return null;
}

export function normalizeLibrarySource(
    raw: string | undefined
): LibraryItemSource {
    if (raw === "tiktok") {
        return LibraryItemSource.tiktok;
    }
    if (raw === "chrome_bookmarks" || raw === "chrome") {
        return LibraryItemSource.chrome_bookmarks;
    }
    return LibraryItemSource.instagram;
}

function parseScrapedAt(iso: string | undefined): Date | null {
    if (!iso) {
        return null;
    }
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
}

function externalIdForIngestItem(
    source: LibraryItemSource,
    item: IngestItemInput
): string | undefined {
    if (source === LibraryItemSource.instagram) {
        return item.shortcode;
    }
    if (
        source === LibraryItemSource.tiktok ||
        source === LibraryItemSource.chrome_bookmarks
    ) {
        return item.id;
    }
    return item.id;
}

function ingestItemKind(kind: IngestItemInput["kind"]): "bookmark" | "folder" {
    if (kind === "folder") {
        return "folder";
    }
    return "bookmark";
}

function buildIngestUpdateRow(
    browserProfileId: string,
    externalId: string,
    item: IngestItemInput,
    source: LibraryItemSource
) {
    return {
        browserProfileId,
        caption: item.caption ?? null,
        externalId,
        kind: ingestItemKind(item.kind),
        parentExternalId: item.parentExternalId ?? null,
        postedAt: parseScrapedAt(item.postedAt),
        scrapedAt: parseScrapedAt(item.scrapedAt),
        source,
        sourceDeviceId: item.sourceDeviceId ?? null,
        sourceDeviceName: item.sourceDeviceName ?? null,
        sourceMetadata: item.sourceMetadata ?? null,
        thumbnailUrl: item.thumbnailUrl ?? null,
        url: item.url,
    };
}

function buildIngestCreateRow(
    browserProfileId: string,
    externalId: string,
    item: IngestItemInput,
    source: LibraryItemSource,
    userId: string
) {
    return {
        ...buildIngestUpdateRow(browserProfileId, externalId, item, source),
        userId,
    };
}

export interface IngestItemInput {
    browserProfileId?: string;
    caption?: string;
    id?: string;
    kind?: "bookmark" | "folder";
    parentExternalId?: string;
    postedAt?: string;
    scrapedAt?: string;
    shortcode?: string;
    sourceDeviceId?: string;
    sourceDeviceName?: string;
    sourceMetadata?: Record<string, unknown> | null;
    thumbnailUrl?: string;
    url: string;
}

/**
 * Upserts library rows for one ingest payload (chunk or complete).
 */
export async function upsertLibraryItemsFromIngest(
    userId: string,
    source: LibraryItemSource,
    items: IngestItemInput[]
): Promise<number> {
    let count = 0;
    const libraryItemDelegate = prisma.libraryItem as unknown as {
        upsert(args: {
            create: {
                browserProfileId: string;
                caption: string | null;
                externalId: string;
                kind: "bookmark" | "folder";
                parentExternalId: string | null;
                postedAt: Date | null;
                scrapedAt: Date | null;
                source: LibraryItemSource;
                sourceDeviceId: string | null;
                sourceDeviceName: string | null;
                sourceMetadata: Record<string, unknown> | null;
                thumbnailUrl: string | null;
                url: string;
                userId: string;
            };
            update: {
                browserProfileId: string;
                caption: string | null;
                kind: "bookmark" | "folder";
                parentExternalId: string | null;
                postedAt: Date | null;
                scrapedAt: Date | null;
                sourceDeviceId: string | null;
                sourceDeviceName: string | null;
                sourceMetadata: Record<string, unknown> | null;
                thumbnailUrl: string | null;
                url: string;
            };
            where: {
                userId_source_browserProfileId_externalId: {
                    browserProfileId: string;
                    externalId: string;
                    source: LibraryItemSource;
                    userId: string;
                };
            };
        }): Promise<unknown>;
    };

    for (const item of items) {
        const externalId = externalIdForIngestItem(source, item);
        if (!externalId) {
            continue;
        }
        const browserProfileId =
            item.browserProfileId?.trim() || DEFAULT_BROWSER_PROFILE_ID;
        await libraryItemDelegate.upsert({
            create: buildIngestCreateRow(
                browserProfileId,
                externalId,
                item,
                source,
                userId
            ),
            update: buildIngestUpdateRow(
                browserProfileId,
                externalId,
                item,
                source
            ),
            where: {
                userId_source_browserProfileId_externalId: {
                    browserProfileId,
                    externalId,
                    source,
                    userId,
                },
            },
        });
        count += 1;
    }

    return count;
}
