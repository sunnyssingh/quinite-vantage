-- Add location fields directly to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS locality TEXT,
ADD COLUMN IF NOT EXISTS landmark TEXT,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false;

-- Convert old 'draft' project_status back to normal and set is_draft = true
UPDATE public.projects
SET is_draft = true, project_status = 'planning'
WHERE project_status = 'draft';

-- Optionally backfill data from metadata->real_estate->location
UPDATE public.projects
SET 
  city = (metadata->'real_estate'->'location'->>'city'),
  state = (metadata->'real_estate'->'location'->>'state'),
  country = COALESCE((metadata->'real_estate'->'location'->>'country'), 'India'),
  pincode = (metadata->'real_estate'->'location'->>'pincode'),
  locality = (metadata->'real_estate'->'location'->>'locality'),
  landmark = (metadata->'real_estate'->'location'->>'landmark')
WHERE city IS NULL AND metadata->'real_estate'->'location' IS NOT NULL;
