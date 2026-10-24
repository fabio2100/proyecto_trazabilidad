/*
  Warnings:

  - You are about to drop the column `age` on the `Patients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Patients" DROP COLUMN "age",
ADD COLUMN     "fechaNacimiento" DATE;
