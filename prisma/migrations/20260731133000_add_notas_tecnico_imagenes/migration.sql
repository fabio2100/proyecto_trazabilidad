-- AlterTable
ALTER TABLE "NotasDelTecnico"
ADD COLUMN "imagenes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
