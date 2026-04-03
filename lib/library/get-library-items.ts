import "server-only";

import { prisma } from "@/prisma";
import type {
    LibraryCollectionSummary,
    LibraryItemWithCollections,
} from "@/lib/library/types";

export async function getLibraryItemsForUser(userId: string) {
    const [items, collections] = await Promise.all([
        prisma.libraryItem.findMany({
            include: {
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
            },
            orderBy: [{ scrapedAt: "desc" }, { updatedAt: "desc" }],
            where: {
                kind: "bookmark",
                userId,
            },
        }) as Promise<LibraryItemWithCollections[]>,
        prisma.collection.findMany({
            orderBy: {
                name: "asc",
            },
            select: {
                _count: {
                    select: {
                        items: true,
                    },
                },
                description: true,
                id: true,
                name: true,
            },
            where: {
                userId,
            },
        }),
    ]);

    return {
        collections: collections.map(
            (collection): LibraryCollectionSummary => ({
                description: collection.description,
                id: collection.id,
                itemCount: collection._count.items,
                name: collection.name,
            })
        ),
        items,
    };
}
