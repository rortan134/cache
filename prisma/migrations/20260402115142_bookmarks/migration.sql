-- AlterEnum
ALTER TYPE "LibraryItemSource" ADD VALUE 'chrome_bookmarks';

-- AlterTable
ALTER TABLE "library_item" ADD COLUMN     "postedAt" TIMESTAMP(3);

-- RenameIndex
ALTER INDEX "library_item_userId_source_browserProfileId_parentExternalId_id" RENAME TO "library_item_userId_source_browserProfileId_parentExternalI_idx";
