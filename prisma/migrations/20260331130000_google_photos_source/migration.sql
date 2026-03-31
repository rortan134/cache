-- AlterEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        INNER JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'LibraryItemSource'
          AND e.enumlabel = 'google_photos'
    ) THEN
        ALTER TYPE "LibraryItemSource" ADD VALUE 'google_photos';
    END IF;
END $$;
