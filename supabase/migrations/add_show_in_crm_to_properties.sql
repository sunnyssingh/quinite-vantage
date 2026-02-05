-- Add show_in_crm column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS show_in_crm boolean DEFAULT true;

-- Add comment
COMMENT ON COLUMN public.properties.show_in_crm IS 'Whether this property is visible in the CRM module';

-- Update existing records to true
UPDATE public.properties SET show_in_crm = true WHERE show_in_crm IS NULL;
