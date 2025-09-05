-- Step 1: Add the new collection_id column to the examinees table
ALTER TABLE public.examinees
ADD COLUMN IF NOT EXISTS collection_id UUID;

-- Step 2: Add the foreign key constraint to the new column
ALTER TABLE public.examinees
ADD CONSTRAINT examinees_collection_id_fkey
FOREIGN KEY (collection_id)
REFERENCES public.collections(id);
