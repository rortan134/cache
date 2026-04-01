import "server-only";

import type { LibraryItem } from "@/prisma/client/client";
import { prisma } from "@/prisma";

export async function getLibraryItemsForUser(userId: string) {
    const libraryItemDelegate = prisma.libraryItem as unknown as {
        findMany(args: {
            orderBy: readonly { readonly scrapedAt?: "asc" | "desc"; readonly updatedAt?: "asc" | "desc" }[];
            where: {
                kind: "bookmark";
                userId: string;
            };
        }): Promise<LibraryItem[]>;
    };

    const items = await libraryItemDelegate.findMany({
        orderBy: [{ scrapedAt: "desc" }, { updatedAt: "desc" }],
        where: {
            kind: "bookmark",
            userId,
        },
    });

    return { items };
}
