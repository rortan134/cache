DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'LibraryItemSource'
            AND e.enumlabel = 'cache_note'
    ) THEN
        ALTER TYPE "LibraryItemSource" ADD VALUE 'cache_note';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'LibraryItemKind'
            AND e.enumlabel = 'note'
    ) THEN
        ALTER TYPE "LibraryItemKind" ADD VALUE 'note';
    END IF;
END $$;

ALTER TABLE "library_item"
    ADD COLUMN IF NOT EXISTS "noteContentHtml" TEXT,
    ADD COLUMN IF NOT EXISTS "noteContentText" TEXT;
