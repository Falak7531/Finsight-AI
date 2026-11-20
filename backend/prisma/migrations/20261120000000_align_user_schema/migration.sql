-- Bridge the original integer User model to the UUID model used by financial
-- records. Keep the original migration unchanged for databases that applied it.
-- Transactional: duplicate emails or unexpected dependent foreign keys stop the
-- migration without deleting users or partially changing their identifiers.
BEGIN;

ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;
-- Deterministic, unique mapping preserves the correspondence with legacy IDs.
ALTER TABLE "User" ALTER COLUMN "id" TYPE UUID
  USING ('00000000-0000-4000-8000-' || lpad("id"::text, 12, '0'))::uuid;

UPDATE "User" SET "name" = "email" WHERE "name" IS NULL;
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "User"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

COMMIT;
