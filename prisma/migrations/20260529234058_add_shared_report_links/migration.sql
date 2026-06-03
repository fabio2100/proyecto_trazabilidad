-- CreateTable
CREATE TABLE "SharedReportLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "informeId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedReportLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedReportLink_token_key" ON "SharedReportLink"("token");

-- AddForeignKey
ALTER TABLE "SharedReportLink" ADD CONSTRAINT "SharedReportLink_informeId_fkey" FOREIGN KEY ("informeId") REFERENCES "Informes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
