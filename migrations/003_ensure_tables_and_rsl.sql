-- ============================================
-- ENSURE ALL REQUIRED TABLES EXIST
-- Run this in Supabase SQL Editor to fix 500 Errors
-- ============================================

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    onboarding_status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- 2. Organization Profiles Table
CREATE TABLE IF NOT EXISTS public.organization_profiles (
    organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    sector TEXT,
    business_type TEXT,
    gstin TEXT,
    contact_number TEXT,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    pincode TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT,
    organization_id UUID REFERENCES public.organizations(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Profiles Table (Ensure organization_id and role_id exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
        ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role_id') THEN
        ALTER TABLE public.profiles ADD COLUMN role_id UUID REFERENCES public.roles(id);
    END IF;
END $$;

-- 6. Insert Default Roles
INSERT INTO public.roles (name, description)
VALUES ('Client Super Admin', 'Full access to organization resources')
ON CONFLICT (name) DO NOTHING;

-- 7. Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 8. Add Basic Policies (Allow authenticated users to read/update their own data)
-- Note: Service Role (Admin) bypasses these, so these are minimal for frontend usage

-- Organizations: Users can view their own organization
CREATE POLICY "Users can view own organization" ON public.organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- Org Profiles: Users can view/update their own org profile
CREATE POLICY "Users can view own org profile" ON public.organization_profiles
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update own org profile" ON public.organization_profiles
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- Roles: Public read
CREATE POLICY "Roles are readable by everyone" ON public.roles
    FOR SELECT USING (true);

-- Profiles: Users can view own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());
    
-- Audit Logs: Users can view logs for their organization
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );
