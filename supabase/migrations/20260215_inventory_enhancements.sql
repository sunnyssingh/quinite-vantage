-- Add inventory tracking fields to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS block_name TEXT,
ADD COLUMN IF NOT EXISTS floor_number TEXT,
ADD COLUMN IF NOT EXISTS unit_number TEXT,
ADD COLUMN IF NOT EXISTS configuration TEXT;

-- Add comments
COMMENT ON COLUMN public.properties.block_name IS 'Building block or tower name (e.g., Tower A)';
COMMENT ON COLUMN public.properties.floor_number IS 'Floor number (e.g., 1, G, 12)';
COMMENT ON COLUMN public.properties.unit_number IS 'Specific unit number (e.g., 101, 1202)';
COMMENT ON COLUMN public.properties.configuration IS 'Unit configuration (e.g., 3BHK, 2BHK)';

-- Create index for faster filtering by block
CREATE INDEX IF NOT EXISTS idx_properties_block ON public.properties(block_name);
CREATE INDEX IF NOT EXISTS idx_properties_project_block ON public.properties(project_id, block_name);
