import type { LibraryItem } from "@/prisma/client/client";

export interface LibraryCollectionTag {
    readonly id: string;
    readonly name: string;
}

export interface LibraryCollectionSummary extends LibraryCollectionTag {
    readonly itemCount: number;
}

export interface LibraryItemWithCollections extends LibraryItem {
    readonly collections: LibraryCollectionTag[];
}
