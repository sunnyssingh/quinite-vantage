-- Migration: Add caller_id to organizations table

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS caller_id TEXT;

-- Optional: Migrate existing settings->caller_id to new column
UPDATE public.organizations
SET caller_id = settings->>'caller_id'
WHERE settings ? 'caller_id';
