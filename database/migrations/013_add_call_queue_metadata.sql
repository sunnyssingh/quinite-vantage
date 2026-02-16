-- Add metadata column to call_queue table for storing retry reasons and other info
ALTER TABLE call_queue ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
