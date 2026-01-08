-- Add call recording consent and tracking
-- Ensures compliance with recording regulations

-- Add consent field to leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS recording_consent BOOLEAN DEFAULT true;

-- Add recording metadata to call_logs
ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS recording_duration INTEGER,
  ADD COLUMN IF NOT EXISTS recording_format TEXT DEFAULT 'mp3';

-- Create index for recordings
CREATE INDEX IF NOT EXISTS idx_call_logs_recording 
  ON call_logs(recording_url) WHERE recording_url IS NOT NULL;

-- Verify changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'leads' AND column_name = 'recording_consent';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'call_logs' 
  AND column_name IN ('recording_duration', 'recording_format')
ORDER BY ordinal_position;
