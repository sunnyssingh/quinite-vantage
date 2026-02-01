-- Add country and currency fields to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS currency text,
ADD COLUMN IF NOT EXISTS currency_symbol text;

-- Add comment
COMMENT ON COLUMN organizations.country IS 'Country of the organization';
COMMENT ON COLUMN organizations.currency IS 'Currency code (e.g. USD, INR) for the organization';
