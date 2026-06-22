-- CreateTable
CREATE TABLE "Perfiles" (
    "id"   TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    CONSTRAINT "Perfiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Perfiles_tipo_key" ON "Perfiles"("tipo");

-- Seed default profiles
INSERT INTO "Perfiles" ("id", "tipo") VALUES
    ('11111111-1111-1111-1111-111111111111', 'administrativo'),
    ('22222222-2222-2222-2222-222222222222', 'tecnico'),
    ('33333333-3333-3333-3333-333333333333', 'medico'),
    ('44444444-4444-4444-4444-444444444444', 'superusuario');

-- AlterTable: add perfilId to Users with DB-level default (backfills existing rows)
ALTER TABLE "Users"
    ADD COLUMN "perfilId" TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';

-- AddForeignKey
ALTER TABLE "Users"
    ADD CONSTRAINT "Users_perfilId_fkey"
    FOREIGN KEY ("perfilId") REFERENCES "Perfiles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
