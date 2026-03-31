-- AlterEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        INNER JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'LibraryItemSource'
          AND e.enumlabel = 'pinterest'
    ) THEN
        ALTER TYPE "LibraryItemSource" ADD VALUE 'pinterest';
    END IF;
END $$;
