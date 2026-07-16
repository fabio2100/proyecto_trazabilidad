-- Add the new month column if it does not exist yet
ALTER TABLE "DiagnosisSequence"
  ADD COLUMN IF NOT EXISTS "month" INTEGER;

-- Backfill existing rows with the current month so the new composite key can be created
UPDATE "DiagnosisSequence"
SET "month" = EXTRACT(MONTH FROM CURRENT_DATE),
    "lastValue" = 0
WHERE "month" IS NULL;

-- Make month non-null
ALTER TABLE "DiagnosisSequence"
  ALTER COLUMN "month" SET NOT NULL;

-- Drop legacy primary key and recreate composite primary key
ALTER TABLE "DiagnosisSequence"
  DROP CONSTRAINT IF EXISTS "DiagnosisSequence_pkey";

ALTER TABLE "DiagnosisSequence"
  ADD CONSTRAINT "DiagnosisSequence_pkey" PRIMARY KEY ("year", "month");
