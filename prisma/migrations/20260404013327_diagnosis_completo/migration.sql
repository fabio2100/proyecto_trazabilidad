/*
  Warnings:

  - Added the required column `biopsasPrevias` to the `Diagnosis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `material` to the `Diagnosis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profesionalSolicitante` to the `Diagnosis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Diagnosis" ADD COLUMN     "biopsasPrevias" BOOLEAN NOT NULL,
ADD COLUMN     "material" TEXT NOT NULL,
ADD COLUMN     "profesionalSolicitante" TEXT NOT NULL;
