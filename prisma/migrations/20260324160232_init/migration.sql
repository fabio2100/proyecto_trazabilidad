-- CreateTable
CREATE TABLE "First" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "First_pkey" PRIMARY KEY ("id")
);
