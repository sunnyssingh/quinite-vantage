-- Leads Table Migration
-- Run this in Supabase SQL Editor

-- Create leads table
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
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_org 
  ON public.leads(organization_id);

CREATE INDEX IF NOT EXISTS idx_leads_project 
  ON public.leads(project_id);

CREATE INDEX IF NOT EXISTS idx_leads_status 
  ON public.leads(status);

CREATE INDEX IF NOT EXISTS idx_leads_created 
  ON public.leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_email 
  ON public.leads(email) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_phone 
  ON public.leads(phone) WHERE phone IS NOT NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- Verify table creation
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;
