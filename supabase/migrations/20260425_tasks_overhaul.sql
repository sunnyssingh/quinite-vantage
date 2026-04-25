-- Tasks Overhaul Migration
-- Renames lead_tasks → tasks, makes lead_id optional, adds project_id,
-- adds updated_by/updated_at, adds granular task permissions with view scope.

BEGIN;

-- ─── 1. Rename table + constraints ─────────────────────────────────────────
ALTER TABLE public.lead_tasks RENAME TO tasks;

-- Rename primary key + FK constraints so PostgREST can resolve relationships
-- by the new table name (Postgres keeps old names on rename without these)
ALTER TABLE public.tasks RENAME CONSTRAINT lead_tasks_pkey               TO tasks_pkey;
ALTER TABLE public.tasks RENAME CONSTRAINT lead_tasks_lead_id_fkey       TO tasks_lead_id_fkey;
ALTER TABLE public.tasks RENAME CONSTRAINT lead_tasks_organization_id_fkey TO tasks_organization_id_fkey;
ALTER TABLE public.tasks RENAME CONSTRAINT lead_tasks_assigned_to_fkey   TO tasks_assigned_to_fkey;
ALTER TABLE public.tasks RENAME CONSTRAINT lead_tasks_created_by_fkey    TO tasks_created_by_fkey;

-- ─── 2. Make lead_id optional + add project_id ──────────────────────────────
ALTER TABLE public.tasks ALTER COLUMN lead_id DROP NOT NULL;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS project_id uuid
    REFERENCES public.projects(id) ON DELETE SET NULL;

-- ─── 3. Add updated_by + updated_at ─────────────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- ─── 4. Auto-update updated_at trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_tasks_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_set_updated_at ON public.tasks;
CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_tasks_updated_at();

-- ─── 5. Add granular task permissions (view scope + CRUD) ───────────────────
INSERT INTO public.features (feature_key, feature_name, description, category, is_active) VALUES
  ('view_all_tasks',  'View All Tasks',  'See all tasks in the organisation',               'crm', true),
  ('view_team_tasks', 'View Team Tasks', 'See tasks on leads assigned to me',               'crm', true),
  ('view_own_tasks',  'View Own Tasks',  'See only tasks created by or assigned to me',     'crm', true),
  ('create_tasks',    'Create Tasks',    'Create new tasks',                                'crm', true),
  ('edit_tasks',      'Edit Tasks',      'Edit existing tasks within scope',                'crm', true),
  ('delete_tasks',    'Delete Tasks',    'Delete tasks within scope',                       'crm', true),
  ('assign_tasks',    'Assign Tasks',    'Assign tasks to other users',                     'crm', true)
ON CONFLICT (feature_key) DO NOTHING;

-- ─── 6. Seed role_permissions for all existing orgs ─────────────────────────
DO $$
DECLARE v_org_id uuid;
BEGIN
  FOR v_org_id IN SELECT DISTINCT organization_id FROM public.role_permissions LOOP
    INSERT INTO public.role_permissions (organization_id, role, feature_key, is_enabled) VALUES
      -- manager: all tasks visible + full CRUD
      (v_org_id, 'manager',  'view_all_tasks',  true),
      (v_org_id, 'manager',  'view_team_tasks', true),
      (v_org_id, 'manager',  'view_own_tasks',  true),
      (v_org_id, 'manager',  'create_tasks',    true),
      (v_org_id, 'manager',  'edit_tasks',      true),
      (v_org_id, 'manager',  'delete_tasks',    true),
      (v_org_id, 'manager',  'assign_tasks',    true),
      -- super_admin: full access to all tasks
      (v_org_id, 'super_admin', 'view_all_tasks',  true),
      (v_org_id, 'super_admin', 'view_team_tasks', true),
      (v_org_id, 'super_admin', 'view_own_tasks',  true),
      (v_org_id, 'super_admin', 'create_tasks',    true),
      (v_org_id, 'super_admin', 'edit_tasks',      true),
      (v_org_id, 'super_admin', 'delete_tasks',    true),
      (v_org_id, 'super_admin', 'assign_tasks',    true),
      -- employee: own tasks only; create + edit own; no delete, no assign
      (v_org_id, 'employee', 'view_all_tasks',  false),
      (v_org_id, 'employee', 'view_team_tasks', false),
      (v_org_id, 'employee', 'view_own_tasks',  true),
      (v_org_id, 'employee', 'create_tasks',    true),
      (v_org_id, 'employee', 'edit_tasks',      true),
      (v_org_id, 'employee', 'delete_tasks',    false),
      (v_org_id, 'employee', 'assign_tasks',    false)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ─── 7. Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_org      ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_lead     ON public.tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project  ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created  ON public.tasks(created_by);

COMMIT;
