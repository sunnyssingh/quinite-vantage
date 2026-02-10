-- =====================================================
-- UPDATE BILLING PLANS FOR 3-TIER MODEL
-- =====================================================

-- Add new columns to billing_plans for feature limits
ALTER TABLE billing_plans 
ADD COLUMN IF NOT EXISTS max_projects INTEGER,
ADD COLUMN IF NOT EXISTS max_leads INTEGER,
ADD COLUMN IF NOT EXISTS max_users INTEGER,
ADD COLUMN IF NOT EXISTS allowed_modules TEXT[] DEFAULT ARRAY['crm'];

-- Deactivate all existing plans
UPDATE billing_plans SET is_active = false;

-- Create Free Plan
INSERT INTO billing_plans (
  name, 
  description, 
  module_type, 
  base_price_inr, 
  per_user_price_inr,
  max_projects,
  max_leads,
  max_users,
  allowed_modules,
  features,
  is_active
) VALUES (
  'Free',
  'Perfect for individuals getting started',
  'crm',
  0,
  0,
  2,
  100,
  1,
  ARRAY['crm'],
  '{
    "csv_export": false, 
    "advanced_analytics": false, 
    "bulk_import": false,
    "inventory_access": false,
    "construction_access": false
  }'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- Create Pro Plan
INSERT INTO billing_plans (
  name, 
  description, 
  module_type, 
  base_price_inr, 
  per_user_price_inr,
  max_projects,
  max_leads,
  max_users,
  allowed_modules,
  features,
  is_active
) VALUES (
  'Pro',
  'For growing teams who need advanced features',
  'all_modules',
  0,
  499,
  10,
  5000,
  NULL, -- NULL means unlimited
  ARRAY['crm', 'inventory'],
  '{
    "csv_export": true, 
    "advanced_analytics": true, 
    "bulk_import": true,
    "inventory_access": true,
    "construction_access": false
  }'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- Create Enterprise Plan
INSERT INTO billing_plans (
  name, 
  description, 
  module_type, 
  base_price_inr, 
  per_user_price_inr,
  max_projects,
  max_leads,
  max_users,
  allowed_modules,
  features,
  is_active
) VALUES (
  'Enterprise',
  'Custom solutions for large organizations',
  'all_modules',
  0,
  0, -- Custom pricing, contact sales
  NULL, -- Unlimited
  NULL, -- Unlimited
  NULL, -- Unlimited
  ARRAY['crm', 'inventory', 'construction'],
  '{
    "csv_export": true, 
    "advanced_analytics": true, 
    "bulk_import": true,
    "inventory_access": true,
    "construction_access": true,
    "custom_features": true,
    "dedicated_support": true,
    "custom_integrations": true
  }'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- Update country pricing for Pro plan international rates
UPDATE country_pricing 
SET per_user_monthly_rate = 7.00 
WHERE country_code = 'US';

-- Add more international pricing
INSERT INTO country_pricing (country_code, country_name, currency_code, per_user_monthly_rate, call_credit_rate, exchange_rate_to_inr) VALUES
('US', 'United States', 'USD', 7.00, 0.05, 83.0000),
('GB', 'United Kingdom', 'GBP', 5.50, 0.04, 105.0000),
('CA', 'Canada', 'CAD', 9.00, 0.06, 62.0000),
('AU', 'Australia', 'AUD', 10.00, 0.07, 56.0000),
('SG', 'Singapore', 'SGD', 9.50, 0.06, 62.0000),
('AE', 'UAE', 'AED', 25.00, 0.18, 22.6000)
ON CONFLICT (country_code) 
DO UPDATE SET 
  per_user_monthly_rate = EXCLUDED.per_user_monthly_rate,
  call_credit_rate = EXCLUDED.call_credit_rate,
  exchange_rate_to_inr = EXCLUDED.exchange_rate_to_inr;

-- =====================================================
-- CREATE SUBSCRIPTION ADD-ONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  addon_type TEXT NOT NULL, -- 'module', 'feature', 'storage', etc.
  price_inr DECIMAL(10,2) NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  billing_frequency TEXT DEFAULT 'monthly' CHECK (billing_frequency IN ('monthly', 'yearly', 'one_time')),
  available_for_plans TEXT[] DEFAULT ARRAY['pro'], -- Which plans can purchase this addon
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Construction Management add-on
INSERT INTO subscription_addons (
  name,
  description,
  addon_type,
  price_inr,
  price_usd,
  billing_frequency,
  available_for_plans,
  features
) VALUES (
  'Construction Management',
  'Complete construction project management module',
  'module',
  4999.00,
  99.00,
  'monthly',
  ARRAY['pro'],
  '{
    "construction_access": true,
    "project_tracking": true,
    "resource_management": true,
    "gantt_charts": true
  }'::jsonb
) ON CONFLICT DO NOTHING;

-- =====================================================
-- CREATE ORGANIZATION ADD-ONS TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS organization_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES subscription_addons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'suspended')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, addon_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organization_addons_org ON organization_addons(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_addons_addon ON organization_addons(addon_id);
CREATE INDEX IF NOT EXISTS idx_organization_addons_status ON organization_addons(status);

-- Enable RLS
ALTER TABLE subscription_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_addons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_addons
CREATE POLICY "Anyone can view active addons" ON subscription_addons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Platform admins full access to addons" ON subscription_addons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_admin'
    )
  );

-- RLS Policies for organization_addons
CREATE POLICY "Organization members view own addons" ON organization_addons
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Super admins manage organization addons" ON organization_addons
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Create updated_at triggers
CREATE TRIGGER update_subscription_addons_updated_at
  BEFORE UPDATE ON subscription_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_addons_updated_at
  BEFORE UPDATE ON organization_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Show active plans
SELECT 
  name, 
  per_user_price_inr,
  max_projects,
  max_leads,
  max_users,
  allowed_modules,
  features
FROM billing_plans 
WHERE is_active = true
ORDER BY per_user_price_inr;
