import "server-only";

import { prisma } from "@/prisma";
import { LibraryItemSource } from "@/prisma/client/enums";

export async function getLibraryItemsForUser(userId: string) {
    const items = await prisma.libraryItem.findMany({
        orderBy: [{ scrapedAt: "desc" }, { updatedAt: "desc" }],
        where: { userId },
    });

    return {
        googlePhotosItems: items.filter(
            (item) => item.source === LibraryItemSource.google_photos
        ),
        instagramItems: items.filter(
            (item) => item.source === LibraryItemSource.instagram
        ),
        items,
        tiktokItems: items.filter(
            (item) => item.source === LibraryItemSource.tiktok
        ),
    };
}
