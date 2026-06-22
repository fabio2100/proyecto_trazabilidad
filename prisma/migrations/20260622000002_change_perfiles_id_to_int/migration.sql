-- DropForeignKey (if it exists)
ALTER TABLE "Users" DROP CONSTRAINT IF EXISTS "Users_perfilId_fkey";

-- Delete existing profiles with UUID IDs
DELETE FROM "Perfiles";

-- Update Users.perfilId to numeric string before converting type
UPDATE "Users" SET "perfilId" = '1' WHERE "perfilId" IS NOT NULL;

-- AlterTable Perfiles: change id from TEXT to INT
ALTER TABLE "Perfiles" ALTER COLUMN "id" TYPE INTEGER USING NULL;

-- AlterTable Users: change perfilId from TEXT to INT
ALTER TABLE "Users" ALTER COLUMN "perfilId" DROP DEFAULT;
ALTER TABLE "Users" ALTER COLUMN "perfilId" TYPE INTEGER USING "perfilId"::integer;
ALTER TABLE "Users" ALTER COLUMN "perfilId" SET DEFAULT 1;

-- Seed Perfiles with numeric IDs
INSERT INTO "Perfiles" ("id", "tipo") VALUES
    (1, 'administrativo'),
    (2, 'tecnico'),
    (3, 'medico'),
    (4, 'superusuario');

-- AddForeignKey
ALTER TABLE "Users"
    ADD CONSTRAINT "Users_perfilId_fkey"
    FOREIGN KEY ("perfilId") REFERENCES "Perfiles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
