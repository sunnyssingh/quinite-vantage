-- Analytics Database Migration
-- Add call tracking fields to campaigns and leads

-- ============================================
-- 1. Add Call Tracking to Campaigns
-- ============================================

ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS total_calls INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transferred_calls INTEGER DEFAULT 0;

-- Add computed conversion rate column
ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2) 
  GENERATED ALWAYS AS (
    CASE 
      WHEN total_calls > 0 THEN (transferred_calls::DECIMAL / total_calls * 100) 
      ELSE 0 
    END
  ) STORED;

-- ============================================
-- 2. Add Call Tracking to Leads
-- ============================================

ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS call_status TEXT DEFAULT 'not_called',
  ADD COLUMN IF NOT EXISTS transferred_to_human BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS call_date TIMESTAMPTZ;

-- Add constraint for call_status (drop first if exists)
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

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_leads_call_status ON leads(call_status);
CREATE INDEX IF NOT EXISTS idx_leads_transferred ON leads(transferred_to_human) WHERE transferred_to_human = TRUE;
CREATE INDEX IF NOT EXISTS idx_campaigns_conversion ON campaigns(conversion_rate DESC);

-- ============================================
-- 3. Verify Changes
-- ============================================

-- Check campaigns columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'campaigns' 
  AND column_name IN ('total_calls', 'transferred_calls', 'conversion_rate')
ORDER BY ordinal_position;

-- Check leads columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'leads' 
  AND column_name IN ('call_status', 'transferred_to_human', 'call_date')
ORDER BY ordinal_position;
