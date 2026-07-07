-- CreateTable
CREATE TABLE "Functions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilesFunctions" (
    "profile_id" INTEGER NOT NULL,
    "function_id" INTEGER NOT NULL,

    CONSTRAINT "PerfilesFunctions_pkey" PRIMARY KEY ("profile_id","function_id")
);

-- AddForeignKey
ALTER TABLE "PerfilesFunctions" ADD CONSTRAINT "PerfilesFunctions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilesFunctions" ADD CONSTRAINT "PerfilesFunctions_function_id_fkey" FOREIGN KEY ("function_id") REFERENCES "Functions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
