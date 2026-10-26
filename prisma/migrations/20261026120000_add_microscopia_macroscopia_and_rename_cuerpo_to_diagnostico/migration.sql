-- Rename existing report body column preserving existing data.
ALTER TABLE "Informes" RENAME COLUMN "cuerpo" TO "diagnostico";

-- Add pathology detail columns as TEXT.
ALTER TABLE "Informes"
ADD COLUMN "microscopia" TEXT,
ADD COLUMN "macroscopia" TEXT;
