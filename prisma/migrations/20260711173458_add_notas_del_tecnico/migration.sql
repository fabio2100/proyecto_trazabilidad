-- CreateTable
CREATE TABLE "NotasDelTecnico" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cuerpo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "NotasDelTecnico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotasDelTecnico_diagnosisId_key" ON "NotasDelTecnico"("diagnosisId");

-- AddForeignKey
ALTER TABLE "NotasDelTecnico" ADD CONSTRAINT "NotasDelTecnico_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotasDelTecnico" ADD CONSTRAINT "NotasDelTecnico_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
