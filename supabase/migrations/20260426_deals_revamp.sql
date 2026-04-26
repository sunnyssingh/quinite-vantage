-- =============================================================
-- Deals Revamp Migration
-- Makes deals the central unit-lead relationship object.
-- =============================================================

-- 1. Drop unused columns and constraints from deals
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_probability_check;
ALTER TABLE public.deals
  DROP COLUMN IF EXISTS stage,
  DROP COLUMN IF EXISTS probability,
  DROP COLUMN IF EXISTS close_date;

-- 2. Add new columns
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS interest_source text NOT NULL DEFAULT 'manual'
    CHECK (interest_source = ANY (ARRAY['manual','site_visit','campaign_call','inbound_call','import'])),
  ADD COLUMN IF NOT EXISTS site_visit_id uuid REFERENCES public.site_visits(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lost_reason text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS reserved_at timestamptz,
  ADD COLUMN IF NOT EXISTS won_at timestamptz,
  ADD COLUMN IF NOT EXISTS lost_at timestamptz;

-- 3. Migrate existing status values before adding new constraint
UPDATE public.deals SET status = 'negotiation' WHERE status = 'active';
UPDATE public.deals SET won_at  = updated_at WHERE status = 'won';
UPDATE public.deals SET lost_at = updated_at WHERE status = 'lost';

-- 4. Drop old status check, add new one
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_status_check;
ALTER TABLE public.deals
  ADD CONSTRAINT deals_status_check
    CHECK (status = ANY (ARRAY['interested','negotiation','reserved','won','lost']));

-- Set a sane default for status going forward
ALTER TABLE public.deals ALTER COLUMN status SET DEFAULT 'interested';

-- 5. Enforce only one reserved and one won deal per unit at a time
CREATE UNIQUE INDEX IF NOT EXISTS deals_one_reserved_per_unit
  ON public.deals (unit_id) WHERE status = 'reserved';
CREATE UNIQUE INDEX IF NOT EXISTS deals_one_won_per_unit
  ON public.deals (unit_id) WHERE status = 'won';

-- 6. Prevent duplicate deal for the same lead+unit pair
CREATE UNIQUE INDEX IF NOT EXISTS deals_unique_lead_unit
  ON public.deals (lead_id, unit_id) WHERE unit_id IS NOT NULL;

-- 7. Performance indexes
CREATE INDEX IF NOT EXISTS idx_deals_unit_id ON public.deals (unit_id);
CREATE INDEX IF NOT EXISTS idx_deals_status  ON public.deals (status);

-- 8. New permission feature keys (table is `features`, not dashboard_features)
--    `manage_deals` already exists — just move it to the 'deals' category
UPDATE public.features SET category = 'deals' WHERE feature_key = 'manage_deals';

INSERT INTO public.features (feature_key, feature_name, description, category) VALUES
  ('view_deals',   'View Deals',   'View deals tab in lead profile and unit dialog', 'deals'),
  ('delete_deals', 'Delete Deals', 'Permanently delete deals',                       'deals')
ON CONFLICT (feature_key) DO NOTHING;

-- 9. Seed role_permissions for all existing organisations
--    super_admin + manager + employee: view_deals + manage_deals
--    super_admin + manager only:       delete_deals
INSERT INTO public.role_permissions (organization_id, role, feature_key, is_enabled)
SELECT o.id, r.role, f.feature_key, true
FROM public.organizations o
CROSS JOIN (VALUES ('super_admin'),('manager'),('employee')) AS r(role)
CROSS JOIN (VALUES ('view_deals'),('manage_deals')) AS f(feature_key)
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (organization_id, role, feature_key, is_enabled)
SELECT o.id, r.role, 'delete_deals', true
FROM public.organizations o
CROSS JOIN (VALUES ('super_admin'),('manager')) AS r(role)
ON CONFLICT DO NOTHING;
