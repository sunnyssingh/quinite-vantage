-- ============================================
-- COMPLETE DATABASE FIX FOR CALL TRACKING
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- Step 1: Add missing columns to call_logs table
ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS call_sid TEXT,
  ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transfer_reason TEXT,
  ADD COLUMN IF NOT EXISTS transfer_department TEXT,
  ADD COLUMN IF NOT EXISTS transcript TEXT,
  ADD COLUMN IF NOT EXISTS conversation_summary TEXT;

-- Step 2: Ensure leads table has required columns
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS call_status TEXT DEFAULT 'not_called',
  ADD COLUMN IF NOT EXISTS transferred_to_human BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS call_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS call_log_id UUID;

-- Step 3: Add constraint for call_status if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'leads_call_status_check'
  ) THEN
    ALTER TABLE leads 
      ADD CONSTRAINT leads_call_status_check 
      CHECK (call_status IN ('not_called', 'called', 'transferred', 'no_answer', 'voicemail'));
  END IF;
END $$;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_logs_call_sid ON call_logs(call_sid);
CREATE INDEX IF NOT EXISTS idx_call_logs_transferred_at ON call_logs(transferred_at);
CREATE INDEX IF NOT EXISTS idx_leads_call_status ON leads(call_status);
CREATE INDEX IF NOT EXISTS idx_leads_transferred ON leads(transferred_to_human) WHERE transferred_to_human = TRUE;
CREATE INDEX IF NOT EXISTS idx_leads_call_log_id ON leads(call_log_id);

-- Step 5: Add foreign key for call_log_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'leads_call_log_id_fkey'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT leads_call_log_id_fkey
      FOREIGN KEY (call_log_id) REFERENCES call_logs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 6: Verify all columns exist
SELECT 
  'call_logs' as table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'call_logs'
  AND column_name IN ('call_sid', 'transferred_at', 'transfer_reason', 'transfer_department', 'transcript', 'conversation_summary')
UNION ALL
SELECT 
  'leads' as table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('call_status', 'transferred_to_human', 'call_date', 'call_log_id')
ORDER BY table_name, column_name;

-- Step 7: Show sample data to verify
SELECT 
  l.id,
  l.name,
  l.call_status,
  l.transferred_to_human,
  cl.call_sid,
  cl.transferred,
  cl.transferred_at
FROM leads l
LEFT JOIN call_logs cl ON l.call_log_id = cl.id
WHERE l.call_status IS NOT NULL
ORDER BY l.created_at DESC
LIMIT 5;
