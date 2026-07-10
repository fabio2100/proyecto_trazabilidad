/*
  Warnings:

  - A unique constraint covering the columns `[sampleCode]` on the table `Diagnosis` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Diagnosis" ADD COLUMN     "sampleCode" TEXT;

-- CreateTable
CREATE TABLE "DiagnosisSequence" (
    "year" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DiagnosisSequence_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE UNIQUE INDEX "Diagnosis_sampleCode_key" ON "Diagnosis"("sampleCode");
