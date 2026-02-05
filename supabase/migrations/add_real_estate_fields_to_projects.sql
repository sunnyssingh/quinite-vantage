-- Add real estate inventory fields to projects table
-- This enables tracking of units, pricing, and inventory visibility

ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS total_units INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_units INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sold_units INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reserved_units INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_types JSONB,
  ADD COLUMN IF NOT EXISTS price_range JSONB,
  ADD COLUMN IF NOT EXISTS show_in_inventory BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS project_status TEXT DEFAULT 'planning';

-- Add comments for documentation
COMMENT ON COLUMN projects.total_units IS 'Total number of units in the project';
COMMENT ON COLUMN projects.available_units IS 'Number of units available for sale';
COMMENT ON COLUMN projects.sold_units IS 'Number of units sold';
COMMENT ON COLUMN projects.reserved_units IS 'Number of units reserved/booked';
COMMENT ON COLUMN projects.unit_types IS 'JSON object with unit type breakdown, e.g., {"1BHK": 10, "2BHK": 15}';
COMMENT ON COLUMN projects.price_range IS 'JSON object with min/max prices, e.g., {"min": 5000000, "max": 15000000}';
COMMENT ON COLUMN projects.show_in_inventory IS 'Whether this project should be visible in the inventory module';
COMMENT ON COLUMN projects.project_status IS 'Current status: planning, under_construction, ready_to_move, completed';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_show_in_inventory ON projects(show_in_inventory);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);
