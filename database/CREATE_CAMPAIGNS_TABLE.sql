-- Create campaigns table for scheduling calls/agent campaigns

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  start_date DATE,
  end_date DATE,
  time_start TIME,
  time_end TIME,
  status TEXT DEFAULT 'scheduled',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_project ON campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON campaigns(scheduled_at DESC);

-- Example RLS policies (enable RLS if desired)
-- ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Org members can select campaigns" ON campaigns FOR SELECT
-- USING (
--   organization_id IN (
--     SELECT organization_id FROM profiles WHERE id = auth.uid()
--   )
-- );
