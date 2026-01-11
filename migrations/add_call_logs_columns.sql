-- Add Missing Columns to call_logs Table
-- These columns are required for proper call transfer tracking

ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS call_sid TEXT,
  ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transfer_reason TEXT,
  ADD COLUMN IF NOT EXISTS transfer_department TEXT,
  ADD COLUMN IF NOT EXISTS transcript TEXT,
  ADD COLUMN IF NOT EXISTS conversation_summary TEXT;

-- Create index on call_sid for faster lookups
CREATE INDEX IF NOT EXISTS idx_call_logs_call_sid ON call_logs(call_sid);

-- Add comment
COMMENT ON COLUMN call_logs.call_sid IS 'Plivo call UUID for tracking';
COMMENT ON COLUMN call_logs.transferred_at IS 'Timestamp when call was transferred to human';
COMMENT ON COLUMN call_logs.transfer_reason IS 'Reason provided by AI for transfer';
COMMENT ON COLUMN call_logs.transfer_department IS 'Department call was transferred to (sales/support)';
COMMENT ON COLUMN call_logs.transcript IS 'Full conversation transcript';
COMMENT ON COLUMN call_logs.conversation_summary IS 'AI-generated summary of conversation';

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'call_logs'
  AND column_name IN ('call_sid', 'transferred_at', 'transfer_reason', 'transfer_department', 'transcript', 'conversation_summary')
ORDER BY ordinal_position;
