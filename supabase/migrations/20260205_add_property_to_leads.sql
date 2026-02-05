-- Add property_id to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON leads(property_id);

-- Add comment
COMMENT ON COLUMN leads.property_id IS 'Specific property unit linked to this lead';
