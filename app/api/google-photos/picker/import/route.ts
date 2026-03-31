import { auth } from "@/lib/auth/server";
import type { GooglePhotosPickedMediaItem } from "@/lib/integrations/google-photos/picker-api";
import {
    deletePickerSession,
    getPickerSession,
    GooglePhotosPickerApiError,
    listPickedMediaItems,
} from "@/lib/integrations/google-photos/picker-api";
import { prisma } from "@/prisma";
import { LibraryItemSource } from "@/prisma/client/enums";
import { headers } from "next/headers";
import * as z from "zod";

const bodySchema = z.object({
    sessionId: z.string().min(1),
});

function mediaUrlFromItem(item: GooglePhotosPickedMediaItem): string | null {
    const baseUrl = item.mediaFile?.baseUrl;
    if (!baseUrl) {
        return null;
    }
    if (item.mediaFile?.mimeType?.startsWith("video/")) {
        return `${baseUrl}=dv`;
    }
    return `${baseUrl}=w2048-h2048`;
}

function mediaThumbnailFromItem(
    item: GooglePhotosPickedMediaItem
): string | null {
    const baseUrl = item.mediaFile?.baseUrl;
    if (!baseUrl) {
        return null;
    }
    return `${baseUrl}=w640-h640-c`;
}

async function resolveGoogleAccessToken(): Promise<string | null> {
    const tokenResponse = await auth.api.getAccessToken({
        body: { providerId: "google" },
        headers: await headers(),
    });
    return tokenResponse?.accessToken ?? null;
}

export async function POST(request: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bodyRaw = await request.json().catch(() => null);
    const parsedBody = bodySchema.safeParse(bodyRaw);
    if (!parsedBody.success) {
        return Response.json(
            { error: parsedBody.error.flatten() },
            { status: 400 }
        );
    }

    const accessToken = await resolveGoogleAccessToken();
    if (!accessToken) {
        return Response.json(
            { error: "Missing Google access token. Reconnect Google first." },
            { status: 403 }
        );
    }

    try {
        const pickerSession = await getPickerSession(
            accessToken,
            parsedBody.data.sessionId
        );
        if (!pickerSession.mediaItemsSet) {
            return Response.json(
                { error: "Selection is not complete yet." },
                { status: 409 }
            );
        }

        const pickedItems = await listPickedMediaItems(
            accessToken,
            parsedBody.data.sessionId
        );

        let importedCount = 0;
        let skippedCount = 0;
        for (const item of pickedItems) {
            const url = mediaUrlFromItem(item);
            const thumbnailUrl = mediaThumbnailFromItem(item);
            if (!url) {
                skippedCount += 1;
                continue;
            }

            // Google Photos Picker baseUrl values are short-lived; durable storage is a follow-up.
            await prisma.libraryItem.upsert({
                create: {
                    caption: item.mediaFile?.filename ?? null,
                    externalId: item.id,
                    scrapedAt: item.createTime
                        ? new Date(item.createTime)
                        : null,
                    source: LibraryItemSource.google_photos,
                    thumbnailUrl,
                    url,
                    userId: session.user.id,
                },
                update: {
                    caption: item.mediaFile?.filename ?? null,
                    scrapedAt: item.createTime
                        ? new Date(item.createTime)
                        : null,
                    thumbnailUrl,
                    url,
                },
                where: {
                    userId_source_externalId: {
                        externalId: item.id,
                        source: LibraryItemSource.google_photos,
                        userId: session.user.id,
                    },
                },
            });
            importedCount += 1;
        }

        await deletePickerSession(accessToken, parsedBody.data.sessionId);

        return Response.json({
            importedCount,
            skippedCount,
            totalPicked: pickedItems.length,
        });
    } catch (error) {
        if (error instanceof GooglePhotosPickerApiError) {
            const message =
                error.status === 401
                    ? "Your Google account needs Photos permission. Please sign out and sign back in to reconnect."
                    : error.message;
            return Response.json({ error: message }, { status: error.status });
        }
        throw error;
    }
}
