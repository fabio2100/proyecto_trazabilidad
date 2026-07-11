-- CreateTable
CREATE TABLE "SeedLog" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeedLog_pkey" PRIMARY KEY ("id")
);
