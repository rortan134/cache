import "server-only";

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
    return raw === "tiktok"
        ? LibraryItemSource.tiktok
        : LibraryItemSource.instagram;
}

function parseScrapedAt(iso: string | undefined): Date | null {
    if (!iso) {
        return null;
    }
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
}

export interface IngestItemInput {
    caption?: string;
    id?: string;
    scrapedAt?: string;
    shortcode?: string;
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
    await prisma.$transaction(async (tx) => {
        for (const item of items) {
            const externalId =
                source === LibraryItemSource.instagram
                    ? item.shortcode
                    : item.id;
            if (!externalId) {
                continue;
            }
            await tx.libraryItem.upsert({
                create: {
                    caption: item.caption ?? null,
                    externalId,
                    scrapedAt: parseScrapedAt(item.scrapedAt),
                    source,
                    thumbnailUrl: item.thumbnailUrl ?? null,
                    url: item.url,
                    userId,
                },
                update: {
                    caption: item.caption ?? null,
                    scrapedAt: parseScrapedAt(item.scrapedAt),
                    thumbnailUrl: item.thumbnailUrl ?? null,
                    url: item.url,
                },
                where: {
                    userId_source_externalId: {
                        externalId,
                        source,
                        userId,
                    },
                },
            });
            count += 1;
        }
    });
    return count;
}
