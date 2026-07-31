-- AlterTable
ALTER TABLE "Diagnosis" ADD COLUMN "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Diagnosis"
ADD CONSTRAINT "Diagnosis_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "Users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
