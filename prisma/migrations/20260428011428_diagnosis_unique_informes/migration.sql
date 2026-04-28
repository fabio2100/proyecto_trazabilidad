/*
  Warnings:

  - A unique constraint covering the columns `[diagnosisId]` on the table `Informes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Informes_diagnosisId_key" ON "Informes"("diagnosisId");
