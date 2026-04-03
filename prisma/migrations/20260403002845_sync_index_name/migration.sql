-- AlterTable
ALTER TABLE "_CollectionToLibraryItem" ADD CONSTRAINT "_CollectionToLibraryItem_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CollectionToLibraryItem_AB_unique";
