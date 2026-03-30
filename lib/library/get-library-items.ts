import "server-only";

import { LibraryItemSource } from "@/prisma/client/enums";
import { prisma } from "@/prisma";

export async function getLibraryItemsForUser(userId: string) {
    const items = await prisma.libraryItem.findMany({
        orderBy: [{ scrapedAt: "desc" }, { updatedAt: "desc" }],
        where: { userId },
    });
    return {
        instagram: items.filter(
            (i) => i.source === LibraryItemSource.instagram
        ),
        tiktok: items.filter((i) => i.source === LibraryItemSource.tiktok),
    };
}
