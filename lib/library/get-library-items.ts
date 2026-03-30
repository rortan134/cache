import "server-only";

import { prisma } from "@/prisma";

export async function getLibraryItemsForUser(userId: string) {
    const items = await prisma.libraryItem.findMany({
        orderBy: [{ scrapedAt: "desc" }, { updatedAt: "desc" }],
        where: { userId },
    });
    return { items };
}
