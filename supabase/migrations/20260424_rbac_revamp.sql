-- RBAC Revamp Migration
-- Renames dashboard_* permission tables to clean names, fixes data inconsistencies,
-- adds missing features, adds permission_version for client cache busting.

BEGIN;

-- ─── 1. Rename tables ───────────────────────────────────────────────────────
ALTER TABLE public.dashboard_features        RENAME TO features;
ALTER TABLE public.dashboard_role_permissions RENAME TO role_permissions;
ALTER TABLE public.dashboard_user_permissions RENAME TO user_permissions;

-- ─── 2. Fix 'admin' → 'super_admin' data inconsistency ────────────────────
UPDATE public.role_permissions SET role = 'super_admin' WHERE role = 'admin';
UPDATE public.profiles           SET role = 'super_admin' WHERE role = 'admin';

-- ─── 3. Consolidate invite_users → create_users ───────────────────────────
UPDATE public.role_permissions SET feature_key = 'create_users' WHERE feature_key = 'invite_users';
UPDATE public.user_permissions SET feature_key = 'create_users' WHERE feature_key = 'invite_users';
DELETE FROM public.features WHERE feature_key = 'invite_users';

-- ─── 4. Add genuinely missing features ───────────────────────────────────
INSERT INTO public.features (feature_key, feature_name, description, category, is_active) VALUES
  ('view_pipeline',    'View Pipeline',    'Access the sales pipeline kanban board', 'crm',  true),
  ('view_site_visits', 'View Site Visits', 'Access and manage property site visits', 'crm',  true),
  ('view_tasks',       'View Tasks',       'Access and manage CRM tasks',            'crm',  true)
ON CONFLICT (feature_key) DO NOTHING;

-- ─── 5. Add permission_version to organizations ───────────────────────────
-- Lightweight cache-busting signal: bumped whenever org permissions change.
-- Client polls /api/permissions/my-permissions every 60s and re-fetches if version changed.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS permission_version integer NOT NULL DEFAULT 1;

-- ─── 6. Seed new features into role_permissions for all existing orgs ──────
-- Defaults from permission matrix: view_* = true for both manager + employee
DO $$
DECLARE
  v_org_id uuid;
BEGIN
  FOR v_org_id IN SELECT DISTINCT organization_id FROM public.role_permissions LOOP
    INSERT INTO public.role_permissions (organization_id, role, feature_key, is_enabled) VALUES
      (v_org_id, 'manager',  'view_pipeline',    true),
      (v_org_id, 'employee', 'view_pipeline',    true),
      (v_org_id, 'manager',  'view_site_visits', true),
      (v_org_id, 'employee', 'view_site_visits', true),
      (v_org_id, 'manager',  'view_tasks',       true),
      (v_org_id, 'employee', 'view_tasks',       true)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ─── 7. Indexes ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_role_permissions_org_role ON public.role_permissions(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_feature  ON public.role_permissions(feature_key);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user     ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_feature  ON public.user_permissions(feature_key);
CREATE INDEX IF NOT EXISTS idx_features_category         ON public.features(category);

COMMIT;
