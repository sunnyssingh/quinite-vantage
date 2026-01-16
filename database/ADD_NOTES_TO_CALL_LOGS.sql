-- Add notes column to call_logs table
-- Fixes error: Could not find the 'notes' column of 'call_logs' in the schema cache

ALTER TABLE call_logs 
ADD COLUMN IF NOT EXISTS notes TEXT;
