-- Migration: 20260201_lead_profile_redesign.sql
-- Description: Adds deals table and extends lead_profiles/leads for new layout

-- 1. Create Deals Table
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    amount NUMERIC(12, 2),
    stage TEXT, -- 'Negotiation', 'Qualified', etc.
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    status TEXT DEFAULT 'active', -- 'active', 'won', 'lost'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for deals
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_org_deals" ON deals FOR SELECT TO authenticated USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "manage_org_deals" ON deals FOR ALL TO authenticated USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- 2. Update Lead Profiles Table
ALTER TABLE lead_profiles 
    ADD COLUMN IF NOT EXISTS min_budget NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS max_budget NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS property_type_interest TEXT,
    ADD COLUMN IF NOT EXISTS sub_category_interest TEXT,
    ADD COLUMN IF NOT EXISTS mailing_street TEXT,
    ADD COLUMN IF NOT EXISTS mailing_city TEXT,
    ADD COLUMN IF NOT EXISTS mailing_state TEXT,
    ADD COLUMN IF NOT EXISTS mailing_zip TEXT,
    ADD COLUMN IF NOT EXISTS mailing_country TEXT;

-- 3. Update Leads Table (Ensure contact info is robust)
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS mobile TEXT,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS department TEXT;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_org_id ON deals(organization_id);
