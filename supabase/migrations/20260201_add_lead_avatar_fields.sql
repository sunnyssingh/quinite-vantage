-- ============================================================================
-- URGENT FIX: Add avatar_url column to leads table
-- ============================================================================
-- This migration adds the missing avatar_url column to the leads table
-- Run this SQL in your Supabase SQL Editor or database console

-- Add avatar_url column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.leads.avatar_url IS 'URL to the lead''s profile avatar image (DiceBear SVG or uploaded image)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'leads' 
  AND column_name = 'avatar_url';
