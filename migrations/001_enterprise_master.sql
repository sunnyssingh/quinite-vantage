-- ==============================================================================
-- ENTERPRISE SAAS MASTER SCHEMA (V2)
-- Architecture: Hybrid Roles (Enum for System, Table+JSONB for App)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- Preserved for analytics

-- 1.1 RESET (DROP EVERYTHING)
DROP TABLE IF EXISTS public.impersonation_sessions CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.call_logs CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.organization_profiles CASCADE; -- legacy
DROP TYPE IF EXISTS public.user_status CASCADE;
DROP TYPE IF EXISTS public.org_tier CASCADE;
DROP TYPE IF EXISTS public.system_role_enum CASCADE;

-- 1.2 RESET AUTH TRIGGERS (Crucial for recursion/timeout fix)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('invited', 'active', 'suspended', 'archived');
    CREATE TYPE org_tier AS ENUM ('free', 'pro', 'enterprise');
    CREATE TYPE system_role_enum AS ENUM ('owner', 'admin', 'member', 'platform_admin'); 
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. CORE TABLES

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    tier org_tier DEFAULT 'free',
    onboarding_status TEXT DEFAULT 'PENDING',
    settings JSONB DEFAULT '{}',
    -- Merged Profile Fields
    sector TEXT DEFAULT 'real_estate',
    business_type TEXT,
    company_name TEXT,
    gstin TEXT,
    address_line_1 TEXT, -- Standardized
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    pincode TEXT,
    contact_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles (Custom Functional Roles)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]', -- ["project.create", "lead.view"]
    is_system_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- Profiles (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    organization_id UUID REFERENCES public.organizations(id),
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL, -- Functional Role
    system_role system_role_enum DEFAULT 'member', -- Billing/System Role
    full_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FEATURE TABLES

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    project_type TEXT,
    status TEXT DEFAULT 'active',
    metadata JSONB,
    image_url TEXT,
    image_path TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT DEFAULT 'manual',
    status TEXT DEFAULT 'new',
    notes TEXT,
    call_log_id UUID, -- For linking last call
    call_status TEXT, -- 'contacted', 'no-answer'
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'running', 'completed'
    start_date DATE,
    end_date DATE,
    time_start TIME,
    time_end TIME,
    metadata JSONB,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Logs
CREATE TABLE IF NOT EXISTS public.call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id),
    lead_id UUID REFERENCES public.leads(id),
    campaign_id UUID REFERENCES public.campaigns(id),
    caller_id UUID REFERENCES auth.users(id),
    status TEXT,
    duration INTEGER DEFAULT 0,
    recording_url TEXT,
    transcript TEXT,
    ai_analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
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

-- Impersonation Sessions
CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    target_user_id UUID REFERENCES auth.users(id),
    reason TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);


-- 5. HELPER FUNCTIONS (SECURITY DEFINER to avoid recursion)

CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_role_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_system_role()
RETURNS system_role_enum
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT system_role FROM public.profiles WHERE id = auth.uid();
$$;

-- Function to check JSONB permissions from role
CREATE OR REPLACE FUNCTION public.auth_has_permission(perm text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  role_perms jsonb;
BEGIN
  SELECT permissions INTO role_perms
  FROM public.roles
  WHERE id = (SELECT role_id FROM public.profiles WHERE id = auth.uid());
  
  IF role_perms IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN (role_perms ? perm);
END;
$$;


-- 6. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Organizations
-- Users can view their own org
CREATE POLICY "View own org" ON public.organizations
    FOR SELECT USING (id = get_auth_org_id());

-- Platform Admins (System Role = Owner? No, Platform Admin is external to this schema, or uses a specific flag?)
-- For now, let's assume 'owner' of an org is powerful, but avoiding Platform Admin complexity unless needed.
-- Or we re-add is_platform_admin? Simplification removed it.
-- Let's stick to standard Tenancy.

-- Roles
-- Viewable by org members
CREATE POLICY "View org roles" ON public.roles
    FOR SELECT USING (organization_id = get_auth_org_id());
-- Managed by Admins/Owners
CREATE POLICY "Manage org roles" ON public.roles
    FOR ALL USING (
        organization_id = get_auth_org_id() 
        AND (get_auth_system_role() IN ('owner', 'admin'))
    );

-- Profiles
-- Viewable by org members
CREATE POLICY "View org profiles" ON public.profiles
    FOR SELECT USING (organization_id = get_auth_org_id());
-- Update own
CREATE POLICY "Update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- Features (Projects, Leads, Campaigns)
-- Viewable by org members
CREATE POLICY "View org projects" ON public.projects
    FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org projects" ON public.projects
    FOR ALL USING (
        organization_id = get_auth_org_id()
        -- AND auth_has_permission('project.edit') -- Optional strict enforcement
    );

CREATE POLICY "View org leads" ON public.leads
    FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org leads" ON public.leads
    FOR ALL USING (organization_id = get_auth_org_id());

CREATE POLICY "View org campaigns" ON public.campaigns
    FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org campaigns" ON public.campaigns
    FOR ALL USING (organization_id = get_auth_org_id());

-- Audit Logs
CREATE POLICY "View org audit logs" ON public.audit_logs
    FOR SELECT USING (organization_id = get_auth_org_id());

-- 7. SEED DEFAULT ROLES
-- We cannot easily seed roles per organization here because orgs don't exist yet for new users.
-- But we can have a trigger to create defaults on Org Creation?
-- OR we just rely on API creation.

-- Triggers for Updated At
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_org_modtime BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_profile_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_project_modtime BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_modified_column();


-- 8. AUTH TRIGGERS (Auto-create Profile)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (creation)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

