-- CreateTable
CREATE TABLE "Informes" (
    "id" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Informes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Informes" ADD CONSTRAINT "Informes_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Informes" ADD CONSTRAINT "Informes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
