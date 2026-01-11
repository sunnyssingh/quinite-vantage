-- Add call_log_id column to leads table
-- This links each lead to their most recent call log

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS call_log_id UUID REFERENCES call_logs(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_call_log_id ON leads(call_log_id);

-- Add comment
COMMENT ON COLUMN leads.call_log_id IS 'Reference to the most recent call log for this lead';
