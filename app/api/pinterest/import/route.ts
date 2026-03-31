import { LibraryItemSource } from "@/prisma/client/enums";
import { auth } from "@/lib/auth/server";
import {
    listPinterestBoardPins,
    listPinterestBoards,
    PinterestApiError,
} from "@/lib/pinterest/api";
import { prisma } from "@/prisma";
import { headers } from "next/headers";

const PINTEREST_PROVIDER_ID = "pinterest";

async function getPinterestAccount(userId: string) {
    return await prisma.account.findFirst({
        select: {
            accountId: true,
        },
        where: {
            providerId: PINTEREST_PROVIDER_ID,
            userId,
        },
    });
}

async function resolvePinterestAccessToken(
    accountId: string,
    requestHeaders: Headers
) {
    const tokenResponse = await auth.api.getAccessToken({
        body: {
            accountId,
            providerId: PINTEREST_PROVIDER_ID,
        },
        headers: requestHeaders,
    });
    return tokenResponse?.accessToken ?? null;
}

function messageForPinterestApiError(error: PinterestApiError): string {
    if (error.status === 401) {
        return "Pinterest asked us to reconnect your account before importing pins.";
    }
    if (error.status === 403) {
        return "Pinterest denied access to boards or pins. Confirm the app has boards:read, pins:read, and user_accounts:read.";
    }
    return error.message;
}

async function importPinterestBoards(
    accessToken: string,
    userId: string
): Promise<{
    boardsCount: number;
    importedCount: number;
    skippedCount: number;
}> {
    const boards = await listPinterestBoards(accessToken);
    const importedExternalIds = new Set<string>();
    let skippedCount = 0;

    for (const board of boards) {
        const pins = await listPinterestBoardPins(accessToken, board);

        for (const pin of pins) {
            if (importedExternalIds.has(pin.externalId)) {
                continue;
            }

            importedExternalIds.add(pin.externalId);
            if (!pin.url) {
                skippedCount += 1;
                continue;
            }

            await prisma.libraryItem.upsert({
                create: {
                    caption: pin.caption,
                    externalId: pin.externalId,
                    scrapedAt: pin.scrapedAt,
                    source: LibraryItemSource.pinterest,
                    thumbnailUrl: pin.thumbnailUrl,
                    url: pin.url,
                    userId,
                },
                update: {
                    caption: pin.caption,
                    scrapedAt: pin.scrapedAt,
                    thumbnailUrl: pin.thumbnailUrl,
                    url: pin.url,
                },
                where: {
                    userId_source_externalId: {
                        externalId: pin.externalId,
                        source: LibraryItemSource.pinterest,
                        userId,
                    },
                },
            });
        }
    }

    return {
        boardsCount: boards.length,
        importedCount: importedExternalIds.size,
        skippedCount,
    };
}

export async function POST() {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({
        headers: requestHeaders,
    });
    const userId = session?.user?.id;
    if (!userId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await getPinterestAccount(userId);
    if (!account) {
        return Response.json(
            { error: "Connect Pinterest before importing pins." },
            { status: 404 }
        );
    }

    const accessToken = await resolvePinterestAccessToken(
        account.accountId,
        requestHeaders
    );
    if (!accessToken) {
        return Response.json(
            { error: "Reconnect Pinterest before importing pins." },
            { status: 403 }
        );
    }

    try {
        return Response.json(await importPinterestBoards(accessToken, userId));
    } catch (error) {
        if (error instanceof PinterestApiError) {
            return Response.json(
                { error: messageForPinterestApiError(error) },
                { status: error.status }
            );
        }

        throw error;
    }
}
