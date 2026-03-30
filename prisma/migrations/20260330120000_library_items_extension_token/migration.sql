-- CreateEnum
CREATE TYPE "LibraryItemSource" AS ENUM ('instagram', 'tiktok');

-- AlterTable
ALTER TABLE "user" ADD COLUMN "extensionIngestToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_extensionIngestToken_key" ON "user"("extensionIngestToken");

-- CreateTable
CREATE TABLE "library_item" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "LibraryItemSource" NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "thumbnailUrl" TEXT,
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "library_item_userId_idx" ON "library_item"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "library_item_userId_source_externalId_key" ON "library_item"("userId", "source", "externalId");

-- AddForeignKey
ALTER TABLE "library_item" ADD CONSTRAINT "library_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
