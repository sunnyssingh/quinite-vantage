-- AI Call Infrastructure - Database Schema
-- Adds fields for AI calling with Plivo + OpenAI

-- Update campaigns table with AI configuration
ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS ai_script TEXT,
  ADD COLUMN IF NOT EXISTS ai_voice TEXT DEFAULT 'alloy',
  ADD COLUMN IF NOT EXISTS ai_language TEXT DEFAULT 'en-IN';

-- Add call tracking fields to call_logs
ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS call_sid TEXT,
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS transcript TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS call_direction TEXT DEFAULT 'outbound';

-- Create unique index for call_sid
CREATE UNIQUE INDEX IF NOT EXISTS idx_call_logs_call_sid 
  ON call_logs(call_sid) WHERE call_sid IS NOT NULL;

-- Add date validation constraint
ALTER TABLE campaigns
  ADD CONSTRAINT check_campaign_dates 
  CHECK (end_date >= start_date);

-- Verify changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'campaigns' 
  AND column_name IN ('ai_script', 'ai_voice', 'ai_language')
ORDER BY ordinal_position;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'call_logs' 
  AND column_name IN ('call_sid', 'recording_url', 'transcript', 'ai_summary', 'call_direction')
ORDER BY ordinal_position;
