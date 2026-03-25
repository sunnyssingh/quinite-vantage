-- UPDATE_PROJECTS_SCHEMA_V3.sql
-- Adds inventory and project status columns to the projects table.

ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS project_status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS total_units INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_units INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sold_units INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reserved_units INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_range JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS unit_types JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS show_in_inventory BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS public_visibility BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS possession_date DATE,
  ADD COLUMN IF NOT EXISTS completion_date DATE;

-- Update properties table
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS block_name TEXT,
  ADD COLUMN IF NOT EXISTS floor_number TEXT,
  ADD COLUMN IF NOT EXISTS unit_number TEXT,
  ADD COLUMN IF NOT EXISTS configuration TEXT,
  ADD COLUMN IF NOT EXISTS show_in_crm BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(project_status);
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON public.projects(public_visibility);
CREATE INDEX IF NOT EXISTS idx_properties_project ON public.properties(project_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
