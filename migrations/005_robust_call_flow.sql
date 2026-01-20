-- Migration 005: Robust Call Flow Fields
-- Enhances leads table to support detailed call outcomes (Abuse, Rejection, scheduling)

-- 1. Add Call Flow Fields to leads table
DO $$
BEGIN
    -- Rejection Reason (e.g., 'Budget', 'Location', 'Not Interested')
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'rejection_reason') THEN
        ALTER TABLE leads ADD COLUMN rejection_reason TEXT;
    END IF;

    -- Abuse Flag (Zero Tolerance Policy)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'abuse_flag') THEN
        ALTER TABLE leads ADD COLUMN abuse_flag BOOLEAN DEFAULT FALSE;
    END IF;

    -- Abuse Details (Transcript snippet or notes)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'abuse_details') THEN
        ALTER TABLE leads ADD COLUMN abuse_details TEXT;
    END IF;

    -- Waiting Status (e.g., 'busy', 'call_later')
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'waiting_status') THEN
        ALTER TABLE leads ADD COLUMN waiting_status TEXT;
    END IF;

    -- Callback Time (Scheduled Time)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'callback_time') THEN
        ALTER TABLE leads ADD COLUMN callback_time TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Lead Source (For Tracking: 'MagicBricks', '99Acres', 'CSV', 'Manual')
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_source') THEN
        ALTER TABLE leads ADD COLUMN lead_source TEXT DEFAULT 'Manual';
    END IF;
    
    -- External Lead ID (Mapping to 3rd party systems)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'external_lead_id') THEN
        ALTER TABLE leads ADD COLUMN external_lead_id TEXT;
    END IF;

    -- Raw Data (JSONB for phase 2 preparedness)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'raw_data') THEN
        ALTER TABLE leads ADD COLUMN raw_data JSONB DEFAULT '{}'::jsonb;
    END IF;

END $$;

-- 2. Create Index for Abuse Flag (for filtering abusive leads)
CREATE INDEX IF NOT EXISTS idx_leads_abuse_flag ON leads(abuse_flag);
CREATE INDEX IF NOT EXISTS idx_leads_waiting_status ON leads(waiting_status);
CREATE INDEX IF NOT EXISTS idx_leads_callback_time ON leads(callback_time);
