-- CreateTable
CREATE TABLE IF NOT EXISTS "collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_CollectionToLibraryItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "collection_userId_idx" ON "collection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "collection_userId_nameKey_key" ON "collection"("userId", "nameKey");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "_CollectionToLibraryItem_AB_unique" ON "_CollectionToLibraryItem"("A", "B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_CollectionToLibraryItem_B_index" ON "_CollectionToLibraryItem"("B");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'collection_userId_fkey'
    ) THEN
        ALTER TABLE "collection"
            ADD CONSTRAINT "collection_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "user"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = '_CollectionToLibraryItem_A_fkey'
    ) THEN
        ALTER TABLE "_CollectionToLibraryItem"
            ADD CONSTRAINT "_CollectionToLibraryItem_A_fkey"
            FOREIGN KEY ("A") REFERENCES "collection"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = '_CollectionToLibraryItem_B_fkey'
    ) THEN
        ALTER TABLE "_CollectionToLibraryItem"
            ADD CONSTRAINT "_CollectionToLibraryItem_B_fkey"
            FOREIGN KEY ("B") REFERENCES "library_item"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
