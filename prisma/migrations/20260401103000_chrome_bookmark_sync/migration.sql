DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'LibraryItemKind'
    ) THEN
        CREATE TYPE "LibraryItemKind" AS ENUM ('bookmark', 'folder');
    END IF;
END $$;

ALTER TABLE "library_item"
    ADD COLUMN IF NOT EXISTS "kind" "LibraryItemKind" NOT NULL DEFAULT 'bookmark',
    ADD COLUMN IF NOT EXISTS "sourceAliasIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS "browserProfileId" TEXT NOT NULL DEFAULT 'default',
    ADD COLUMN IF NOT EXISTS "parentExternalId" TEXT,
    ADD COLUMN IF NOT EXISTS "sourceDeviceId" TEXT,
    ADD COLUMN IF NOT EXISTS "sourceDeviceName" TEXT,
    ADD COLUMN IF NOT EXISTS "sourceMetadata" JSONB;

DROP INDEX IF EXISTS "library_item_userId_source_externalId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "library_item_userId_source_browserProfileId_externalId_key"
    ON "library_item"("userId", "source", "browserProfileId", "externalId");

CREATE INDEX IF NOT EXISTS "library_item_userId_source_browserProfileId_idx"
    ON "library_item"("userId", "source", "browserProfileId");

CREATE INDEX IF NOT EXISTS "library_item_userId_source_browserProfileId_parentExternalId_idx"
    ON "library_item"("userId", "source", "browserProfileId", "parentExternalId");
