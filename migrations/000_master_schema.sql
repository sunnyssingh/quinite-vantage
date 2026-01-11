-- ============================================
-- MASTER DATABASE SCHEMA
-- Quinite Vantage - AI Calling Platform
-- Version: 1.0.0
-- ============================================
-- This is the COMPLETE database schema.
-- Run this on a fresh database to set up everything.
-- ============================================

-- ============================================
-- 1. LEADS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  organization_id UUID NOT NULL,
  project_id UUID NULL,
  created_by UUID NULL,
  
  -- Lead Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'new',
  
  -- Call Tracking Fields
  call_status TEXT DEFAULT 'not_called',
  transferred_to_human BOOLEAN DEFAULT FALSE,
  call_date TIMESTAMPTZ,
  call_log_id UUID,
  
  -- Additional Details
  notes TEXT,
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT leads_organization_id_fkey FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT leads_project_id_fkey FOREIGN KEY (project_id) 
    REFERENCES projects(id) ON DELETE SET NULL,
  CONSTRAINT leads_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT leads_status_check CHECK (
    status IN ('new', 'contacted', 'qualified', 'converted', 'lost')
  ),
  CONSTRAINT leads_source_check CHECK (
    source IN ('manual', 'csv_upload', 'website', 'referral')
  ),
  CONSTRAINT leads_call_status_check CHECK (
    call_status IN ('not_called', 'called', 'transferred', 'no_answer', 'voicemail')
  )
);

-- Leads Indexes
CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_project ON public.leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_call_status ON public.leads(call_status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_transferred ON public.leads(transferred_to_human) WHERE transferred_to_human = TRUE;
CREATE INDEX IF NOT EXISTS idx_leads_call_log_id ON public.leads(call_log_id);

-- Leads Trigger for updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- ============================================
-- 2. CALL_LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  campaign_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Call Identification
  call_sid TEXT,
  
  -- Call Details
  call_status TEXT NOT NULL,
  transferred BOOLEAN DEFAULT FALSE,
  transferred_at TIMESTAMPTZ,
  transfer_reason TEXT,
  transfer_department TEXT,
  call_timestamp TIMESTAMPTZ DEFAULT NOW(),
  duration INTEGER DEFAULT 0,
  
  -- Call Content
  transcript TEXT,
  conversation_summary TEXT,
  recording_url TEXT,
  
  -- Additional Info
  notes TEXT,
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT call_logs_campaign_id_fkey FOREIGN KEY (campaign_id) 
    REFERENCES campaigns(id) ON DELETE CASCADE,
  CONSTRAINT call_logs_lead_id_fkey FOREIGN KEY (lead_id) 
    REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT call_logs_organization_id_fkey FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT call_logs_status_check CHECK (
    call_status IN ('called', 'transferred', 'no_answer', 'voicemail')
  )
);

-- ============================================
-- 2a. SAFE COLUMN UPDATES (For existing tables)
-- ============================================

DO $$
BEGIN
    -- LEADS: Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'call_status') THEN
        ALTER TABLE leads ADD COLUMN call_status TEXT DEFAULT 'not_called';
        ALTER TABLE leads ADD CONSTRAINT leads_call_status_check CHECK (call_status IN ('not_called', 'called', 'transferred', 'no_answer', 'voicemail'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'transferred_to_human') THEN
        ALTER TABLE leads ADD COLUMN transferred_to_human BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'call_date') THEN
        ALTER TABLE leads ADD COLUMN call_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'call_log_id') THEN
        ALTER TABLE leads ADD COLUMN call_log_id UUID;
    END IF;

    -- CALL_LOGS: Add missing columns (organization_id is critical)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'organization_id') THEN
        ALTER TABLE call_logs ADD COLUMN organization_id UUID;
        
        -- Try to populate organization_id from campaigns if possible
        -- This update is safe to run even if empty
        UPDATE call_logs cl
        SET organization_id = c.organization_id
        FROM campaigns c
        WHERE cl.campaign_id = c.id
        AND cl.organization_id IS NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'call_sid') THEN
        ALTER TABLE call_logs ADD COLUMN call_sid TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'transferred') THEN
        ALTER TABLE call_logs ADD COLUMN transferred BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'transferred_at') THEN
        ALTER TABLE call_logs ADD COLUMN transferred_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'transfer_reason') THEN
        ALTER TABLE call_logs ADD COLUMN transfer_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'transfer_department') THEN
        ALTER TABLE call_logs ADD COLUMN transfer_department TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'transcript') THEN
        ALTER TABLE call_logs ADD COLUMN transcript TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'conversation_summary') THEN
        ALTER TABLE call_logs ADD COLUMN conversation_summary TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'recording_url') THEN
        ALTER TABLE call_logs ADD COLUMN recording_url TEXT;
    END IF;
END $$;

-- Call Logs Indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_campaign ON public.call_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_lead ON public.call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_org ON public.call_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_sid ON public.call_logs(call_sid);
CREATE INDEX IF NOT EXISTS idx_call_logs_timestamp ON public.call_logs(call_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_transferred ON public.call_logs(transferred) WHERE transferred = TRUE;
CREATE INDEX IF NOT EXISTS idx_call_logs_transferred_at ON public.call_logs(transferred_at);

-- ============================================
-- 3. ADD FOREIGN KEY FROM LEADS TO CALL_LOGS
-- ============================================

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

-- ============================================
-- 4. CAMPAIGNS ANALYTICS COLUMNS
-- ============================================

ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS total_calls INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transferred_calls INTEGER DEFAULT 0;

-- Add computed conversion rate column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'conversion_rate'
  ) THEN
    ALTER TABLE campaigns 
      ADD COLUMN conversion_rate DECIMAL(5,2) 
      GENERATED ALWAYS AS (
        CASE 
          WHEN total_calls > 0 THEN (transferred_calls::DECIMAL / total_calls * 100) 
          ELSE 0 
        END
      ) STORED;
  END IF;
END $$;

-- Campaigns Analytics Index
CREATE INDEX IF NOT EXISTS idx_campaigns_conversion ON campaigns(conversion_rate DESC);

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================

-- Verify leads table
SELECT 
  'leads' as table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- Verify call_logs table
SELECT 
  'call_logs' as table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'call_logs'
ORDER BY ordinal_position;

-- Verify campaigns analytics columns
SELECT 
  'campaigns' as table_name,
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'campaigns' 
  AND column_name IN ('total_calls', 'transferred_calls', 'conversion_rate')
ORDER BY ordinal_position;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
