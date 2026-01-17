-- ==============================================================================
-- MIGRATION 004: ENSURE AUDIT LOGS & TRACK REGISTRATION
-- ==============================================================================

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id),
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB,
    impersonator_user_id UUID,
    is_impersonated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS (Idempotent)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Ensure RLS Policy Exists
DO $$ BEGIN
    CREATE POLICY "View org audit logs" ON public.audit_logs
        FOR SELECT USING (organization_id = get_auth_org_id());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Update Trigger to Log Registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Create Profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Log to Audit Logs (System Action)
  INSERT INTO public.audit_logs (
    user_id,
    user_name,
    action,
    entity_type,
    metadata
  ) VALUES (
    new.id,
    new.email,
    'USER_REGISTERED',
    'user',
    jsonb_build_object('source', 'auth_trigger')
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
