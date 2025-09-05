-- Step 1: Drop the foreign key constraint
ALTER TABLE public.examinees
DROP CONSTRAINT IF EXISTS examinees_registration_fee_collection_id_fkey;

-- Step 2: Drop the column
ALTER TABLE public.examinees
DROP COLUMN IF EXISTS registration_fee_collection_id;