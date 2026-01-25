-- Migration: 008_create_lms_schema.sql
-- Description: Adds tables for Lead Management System (Pipelines, Stages, Activities)

-- 1. Create Pipelines Table
CREATE TABLE IF NOT EXISTS pipelines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create Pipeline Stages Table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id uuid REFERENCES pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  color text DEFAULT '#cbd5e1',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Enhance Leads Table (Add columns instead of replacing)
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS stage_id uuid REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'Manual',
  ADD COLUMN IF NOT EXISTS score int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;

-- 4. Create Lead Activities Table (The "Timeline")
CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'call', 'note', 'email', 'status_change', 'meeting'
  content jsonb DEFAULT '{}', -- Flexible storage for metadata
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (RBAC Enforced)

-- Pipelines: Visible to everyone in Org, Manageable by Admin/Manager
CREATE POLICY "view_org_pipelines" ON pipelines FOR SELECT TO authenticated USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "manage_org_pipelines" ON pipelines FOR ALL TO authenticated USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) 
  AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'manager', 'platform_admin')
);

-- Pipeline Stages: Visible to everyone, Manageable by Admin/Manager
CREATE POLICY "view_org_stages" ON pipeline_stages FOR SELECT TO authenticated USING (
  pipeline_id IN (SELECT id FROM pipelines WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()))
);
CREATE POLICY "manage_org_stages" ON pipeline_stages FOR ALL TO authenticated USING (
  pipeline_id IN (SELECT id FROM pipelines WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()))
  AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'manager', 'platform_admin')
);

-- Lead Activities: 
-- View: Admins/Managers see all. Employees see their own or if assigned to lead.
CREATE POLICY "view_org_activities" ON lead_activities FOR SELECT TO authenticated USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'manager', 'platform_admin')
    OR created_by = auth.uid()
    OR lead_id IN (SELECT id FROM leads WHERE assigned_to = auth.uid())
  )
);

-- Create: Everyone can add notes/activities to leads they can see
CREATE POLICY "create_org_activities" ON lead_activities FOR INSERT TO authenticated WITH CHECK (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- 7. Seed Default Pipeline for Existing Orgs (Optional Helper Function)
CREATE OR REPLACE FUNCTION seed_default_pipeline_for_org(org_uuid uuid) RETURNS void AS $$
DECLARE
  new_pipeline_id uuid;
BEGIN
  INSERT INTO pipelines (organization_id, name, is_default)
  VALUES (org_uuid, 'Default Pipeline', true)
  RETURNING id INTO new_pipeline_id;

  INSERT INTO pipeline_stages (pipeline_id, name, order_index, color) VALUES
  (new_pipeline_id, 'New Lead', 0, '#3b82f6'),
  (new_pipeline_id, 'Contacted', 1, '#eab308'),
  (new_pipeline_id, 'Qualified', 2, '#22c55e'),
  (new_pipeline_id, 'Negotiation', 3, '#a855f7'),
  (new_pipeline_id, 'Won', 4, '#15803d'),
  (new_pipeline_id, 'Lost', 5, '#ef4444');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
