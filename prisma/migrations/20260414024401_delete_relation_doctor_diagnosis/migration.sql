/*
  Warnings:

  - You are about to drop the column `doctorId` on the `Diagnosis` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Diagnosis" DROP CONSTRAINT "Diagnosis_doctorId_fkey";

-- AlterTable
ALTER TABLE "Diagnosis" DROP COLUMN "doctorId";
