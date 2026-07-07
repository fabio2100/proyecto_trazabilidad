/*
  Warnings:

  - The primary key for the `PerfilesFunctions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `profile_id` on the `PerfilesFunctions` table. All the data in the column will be lost.
  - Added the required column `perfil_id` to the `PerfilesFunctions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PerfilesFunctions" DROP CONSTRAINT "PerfilesFunctions_profile_id_fkey";

-- AlterTable
ALTER TABLE "PerfilesFunctions" DROP CONSTRAINT "PerfilesFunctions_pkey",
DROP COLUMN "profile_id",
ADD COLUMN     "perfil_id" INTEGER NOT NULL,
ADD CONSTRAINT "PerfilesFunctions_pkey" PRIMARY KEY ("perfil_id", "function_id");

-- AddForeignKey
ALTER TABLE "PerfilesFunctions" ADD CONSTRAINT "PerfilesFunctions_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "Perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
