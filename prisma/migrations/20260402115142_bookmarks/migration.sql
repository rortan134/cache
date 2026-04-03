-- AlterEnum
ALTER TYPE "LibraryItemSource" ADD VALUE IF NOT EXISTS 'chrome_bookmarks';

-- AlterTable
ALTER TABLE "library_item" ADD COLUMN IF NOT EXISTS "postedAt" TIMESTAMP(3);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relkind = 'i'
          AND relname = 'library_item_userId_source_browserProfileId_parentExternalId_id'
    ) THEN
        ALTER INDEX "library_item_userId_source_browserProfileId_parentExternalId_id"
            RENAME TO "library_item_user_source_profile_parent_idx";
    END IF;
END $$;
