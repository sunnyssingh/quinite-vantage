-- ==============================================================================
-- QUINITE VANTAGE - MASTER DATABASE SCHEMA
-- Version: 1.0
-- Description: Complete database schema for CRM, Inventory, Billing, and AI Calling
-- ==============================================================================

-- ============================================================================== 
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==============================================================================
-- 2. ENUMS
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('invited', 'active', 'suspended', 'archived');
    CREATE TYPE org_tier AS ENUM ('free', 'pro', 'enterprise');
    CREATE TYPE system_role_enum AS ENUM ('owner', 'admin', 'member', 'platform_admin');
    CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing', 'inactive');
    CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
    CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');
    CREATE TYPE payment_method_type AS ENUM ('card', 'upi', 'bank_transfer', 'razorpay', 'stripe');
    CREATE TYPE queue_status AS ENUM ('queued', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. CORE TABLES
-- ==============================================================================

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    tier org_tier DEFAULT 'free',
    onboarding_status TEXT DEFAULT 'PENDING',
    settings JSONB DEFAULT '{}',
    sector TEXT DEFAULT 'real_estate',
    business_type TEXT,
    company_name TEXT,
    gstin TEXT,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    pincode TEXT,
    contact_number TEXT,
    caller_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    organization_id UUID REFERENCES public.organizations(id),
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    system_role system_role_enum DEFAULT 'member',
    full_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. PROJECT & CRM TABLES
-- ==============================================================================

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

-- Pipelines
CREATE TABLE IF NOT EXISTS public.pipelines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline Stages
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    position INT NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#cbd5e1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT DEFAULT 'manual',
    status TEXT DEFAULT 'new',
    score INT DEFAULT 0,
    notes TEXT,
    call_log_id UUID,
    call_status TEXT,
    abuse_flag BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    recording_consent BOOLEAN DEFAULT false,
    last_contacted_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Activities
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Forms
CREATE TABLE IF NOT EXISTS public.lead_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
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
    status TEXT DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    time_start TIME,
    time_end TIME,
    metadata JSONB,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. CALLING SYSTEM TABLES
-- ==============================================================================

-- Call Logs
CREATE TABLE IF NOT EXISTS public.call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id),
    lead_id UUID REFERENCES public.leads(id),
    campaign_id UUID REFERENCES public.campaigns(id),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    caller_id UUID REFERENCES auth.users(id),
    call_sid TEXT UNIQUE,
    direction TEXT DEFAULT 'outbound',
    caller_number TEXT,
    callee_number TEXT,
    status TEXT,
    call_status TEXT,
    duration INTEGER DEFAULT 0,
    recording_url TEXT,
    conversation_transcript TEXT,
    ai_analysis JSONB,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    transferred BOOLEAN DEFAULT false,
    transferred_at TIMESTAMPTZ,
    transfer_reason TEXT,
    transfer_department TEXT,
    disconnect_reason TEXT,
    disconnect_notes TEXT,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Queue
CREATE TABLE IF NOT EXISTS public.call_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id),
    status queue_status DEFAULT 'queued',
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ DEFAULT NOW(),
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, lead_id)
);

-- ==============================================================================
-- 6. INVENTORY/PROPERTY TABLES
-- ==============================================================================

-- Properties
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    address TEXT,
    price NUMERIC(12, 2) NOT NULL,
    size_sqft INT,
    bedrooms INT,
    bathrooms INT,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property Images
CREATE TABLE IF NOT EXISTS public.property_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property Features
CREATE TABLE IF NOT EXISTS public.property_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. BILLING & SUBSCRIPTION TABLES
-- ==============================================================================

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) DEFAULT 0,
    price_yearly DECIMAL(10, 2) DEFAULT 0,
    features JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status subscription_status DEFAULT 'active',
    billing_cycle billing_cycle DEFAULT 'monthly',
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 month',
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type payment_method_type DEFAULT 'card',
    last4 TEXT,
    brand TEXT,
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    gateway_customer_id TEXT,
    gateway_payment_method_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status invoice_status DEFAULT 'draft',
    invoice_number TEXT UNIQUE,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_at TIMESTAMPTZ,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Logs
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, feature_key, period_start, period_end)
);

-- ==============================================================================
-- 8. SYSTEM TABLES
-- ==============================================================================

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

-- WebSocket Sessions
CREATE TABLE IF NOT EXISTS public.websocket_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    connection_id TEXT UNIQUE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_ping_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_call_logs_call_sid ON public.call_logs(call_sid);
CREATE INDEX IF NOT EXISTS idx_call_logs_organization_id ON public.call_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_campaign_id ON public.call_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON public.call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON public.call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_queue_poll ON public.call_queue(status, next_retry_at) WHERE status IN ('queued', 'processing');
CREATE INDEX IF NOT EXISTS idx_call_queue_campaign ON public.call_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_org_id ON public.payment_methods(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_org_period ON public.usage_logs(organization_id, period_start, period_end);

-- ==============================================================================
-- 10. HELPER FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_role_id()
RETURNS UUID
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

CREATE OR REPLACE FUNCTION public.auth_has_permission(perm TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  role_perms JSONB;
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

-- ==============================================================================
-- 11. TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_org_modtime BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_profile_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_project_modtime BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_subscription_plans_modtime BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_pipelines_modtime BEFORE UPDATE ON pipelines FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_pipeline_stages_modtime BEFORE UPDATE ON pipeline_stages FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_properties_modtime BEFORE UPDATE ON properties FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_number INTEGER;
    invoice_num TEXT;
BEGIN
    SELECT COUNT(*) + 1 INTO next_number FROM public.invoices;
    invoice_num := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(next_number::TEXT, 5, '0');
    RETURN invoice_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number_trigger
    BEFORE INSERT ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own org" ON public.organizations FOR SELECT USING (id = get_auth_org_id());
CREATE POLICY "View org roles" ON public.roles FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org roles" ON public.roles FOR ALL USING (organization_id = get_auth_org_id() AND (get_auth_system_role() IN ('owner', 'admin')));
CREATE POLICY "View org profiles" ON public.profiles FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "View org projects" ON public.projects FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org projects" ON public.projects FOR ALL USING (organization_id = get_auth_org_id());
CREATE POLICY "View org pipelines" ON public.pipelines FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org pipelines" ON public.pipelines FOR ALL USING (organization_id = get_auth_org_id());
CREATE POLICY "View org stages" ON public.pipeline_stages FOR SELECT USING (pipeline_id IN (SELECT id FROM pipelines WHERE organization_id = get_auth_org_id()));
CREATE POLICY "Manage org stages" ON public.pipeline_stages FOR ALL USING (pipeline_id IN (SELECT id FROM pipelines WHERE organization_id = get_auth_org_id()));
CREATE POLICY "View org leads" ON public.leads FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org leads" ON public.leads FOR ALL USING (organization_id = get_auth_org_id());
CREATE POLICY "View org activities" ON public.lead_activities FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Create org activities" ON public.lead_activities FOR INSERT WITH CHECK (organization_id = get_auth_org_id());
CREATE POLICY "View org forms" ON public.lead_forms FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org forms" ON public.lead_forms FOR ALL USING (organization_id = get_auth_org_id());
CREATE POLICY "View org campaigns" ON public.campaigns FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org campaigns" ON public.campaigns FOR ALL USING (organization_id = get_auth_org_id());
CREATE POLICY "View org call logs" ON public.call_logs FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org call logs" ON public.call_logs FOR ALL USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org queue" ON public.call_queue FOR ALL USING (organization_id = get_auth_org_id());
CREATE POLICY "View org properties" ON public.properties FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org properties" ON public.properties FOR ALL USING (organization_id = get_auth_org_id());
CREATE POLICY "View property images" ON public.property_images FOR SELECT USING (property_id IN (SELECT id FROM properties WHERE organization_id = get_auth_org_id()));
CREATE POLICY "Manage property images" ON public.property_images FOR ALL USING (property_id IN (SELECT id FROM properties WHERE organization_id = get_auth_org_id()));
CREATE POLICY "View property features" ON public.property_features FOR SELECT USING (property_id IN (SELECT id FROM properties WHERE organization_id = get_auth_org_id()));
CREATE POLICY "Manage property features" ON public.property_features FOR ALL USING (property_id IN (SELECT id FROM properties WHERE organization_id = get_auth_org_id()));
CREATE POLICY "View subscription plans" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "View org subscription" ON public.subscriptions FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "View org invoices" ON public.invoices FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "View org payment methods" ON public.payment_methods FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "View org usage" ON public.usage_logs FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "View org audit logs" ON public.audit_logs FOR SELECT USING (organization_id = get_auth_org_id());