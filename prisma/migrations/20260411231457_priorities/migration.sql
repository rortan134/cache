-- CreateEnum
CREATE TYPE "CollectionPriority" AS ENUM ('none', 'very_relevant', 'relevant', 'peripheral', 'archive');

-- AlterTable
ALTER TABLE "collection" ADD COLUMN     "priority" "CollectionPriority" NOT NULL DEFAULT 'none';
