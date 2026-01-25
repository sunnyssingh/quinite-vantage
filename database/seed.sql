-- ==============================================================================
-- QUINITE VANTAGE - SEED DATA
-- Description: Initial data for subscription plans and default configurations
-- ==============================================================================

-- ==============================================================================
-- 1. SUBSCRIPTION PLANS
-- ==============================================================================

INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, features, sort_order) VALUES
(
    'Free',
    'free',
    'Perfect for getting started',
    0,
    0,
    '{
        "max_users": 3,
        "max_projects": 2,
        "max_campaigns": 5,
        "ai_calls_per_month": 50,
        "max_leads": 500,
        "support": "community"
    }'::jsonb,
    1
),
(
    'Pro',
    'pro',
    'For growing businesses',
    9999,
    99990,
    '{
        "max_users": 10,
        "max_projects": 10,
        "max_campaigns": 50,
        "ai_calls_per_month": 5000,
        "max_leads": 10000,
        "support": "email",
        "custom_branding": true,
        "advanced_analytics": true
    }'::jsonb,
    2
),
(
    'Enterprise',
    'enterprise',
    'Custom pricing for large organizations',
    0,
    0,
    '{
        "max_users": -1,
        "max_projects": -1,
        "max_campaigns": -1,
        "ai_calls_per_month": -1,
        "max_leads": -1,
        "support": "priority",
        "custom_branding": true,
        "advanced_analytics": true,
        "dedicated_account_manager": true,
        "sla": true,
        "custom_integrations": true,
        "custom_pricing": true
    }'::jsonb,
    3
)
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- 2. MIGRATE EXISTING ORGANIZATIONS TO FREE PLAN
-- ==============================================================================

INSERT INTO public.subscriptions (organization_id, plan_id, status, trial_ends_at)
SELECT 
    o.id,
    (SELECT id FROM public.subscription_plans WHERE slug = 'free' LIMIT 1),
    'trialing',
    NOW() + INTERVAL '14 days'
FROM public.organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM public.subscriptions s WHERE s.organization_id = o.id
);

-- ==============================================================================
-- 3. HELPER FUNCTION: Seed Default Pipeline for Organization
-- ==============================================================================

CREATE OR REPLACE FUNCTION seed_default_pipeline_for_org(org_uuid UUID, proj_uuid UUID) 
RETURNS void AS $$
DECLARE
  new_pipeline_id UUID;
BEGIN
  -- Create default pipeline
  INSERT INTO pipelines (organization_id, name, is_default)
  VALUES (org_uuid, 'Default Pipeline', true)
  RETURNING id INTO new_pipeline_id;

  -- Create default stages for the project
  INSERT INTO pipeline_stages (pipeline_id, project_id, name, order_index, position, color) VALUES
  (new_pipeline_id, proj_uuid, 'New Lead', 0, 0, '#3b82f6'),
  (new_pipeline_id, proj_uuid, 'Contacted', 1, 1, '#eab308'),
  (new_pipeline_id, proj_uuid, 'Qualified', 2, 2, '#22c55e'),
  (new_pipeline_id, proj_uuid, 'Negotiation', 3, 3, '#a855f7'),
  (new_pipeline_id, proj_uuid, 'Won', 4, 4, '#15803d'),
  (new_pipeline_id, proj_uuid, 'Lost', 5, 5, '#ef4444');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- SEED DATA COMPLETE
-- ==============================================================================
