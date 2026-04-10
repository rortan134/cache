import type { LibraryItem } from "@/prisma/client/client";
import type { LibraryItemSource } from "@/prisma/client/enums";

export interface LibraryCollectionTag {
    readonly description?: string | null;
    readonly id: string;
    readonly name: string;
}

export interface LibraryCollectionSummary extends LibraryCollectionTag {
    readonly description: string | null;
    readonly itemCount: number;
    readonly sources: LibraryItemSource[];
}

export interface LibraryItemWithCollections extends LibraryItem {
    readonly collections: LibraryCollectionTag[];
}
