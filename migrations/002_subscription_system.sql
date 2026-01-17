-- ==============================================================================
-- SUBSCRIPTION MANAGEMENT SYSTEM
-- Phase 1: Database Schema
-- ==============================================================================

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing', 'inactive');
    CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
    CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');
    CREATE TYPE payment_method_type AS ENUM ('card', 'upi', 'bank_transfer', 'razorpay', 'stripe');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. SUBSCRIPTION PLANS TABLE
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) DEFAULT 0,
    price_yearly DECIMAL(10, 2) DEFAULT 0,
    features JSONB NOT NULL DEFAULT '{}', -- {"max_users": 10, "max_projects": 5, "ai_calls_per_month": 1000}
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUBSCRIPTIONS TABLE
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

-- 4. PAYMENT METHODS TABLE
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type payment_method_type DEFAULT 'card',
    last4 TEXT,
    brand TEXT, -- "Visa", "Mastercard", "RazorPay"
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    gateway_customer_id TEXT, -- Razorpay/Stripe customer ID
    gateway_payment_method_id TEXT, -- Razorpay/Stripe payment method ID
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INVOICES TABLE
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

-- 6. USAGE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL, -- "ai_calls", "projects", "users", "campaigns"
    usage_count INTEGER DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, feature_key, period_start, period_end)
);

-- 7. INDEXES
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_org_id ON public.payment_methods(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_org_period ON public.usage_logs(organization_id, period_start, period_end);

-- 8. TRIGGERS FOR UPDATED_AT
CREATE TRIGGER update_subscription_plans_modtime BEFORE UPDATE ON subscription_plans 
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 9. ROW LEVEL SECURITY
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Plans are publicly viewable
CREATE POLICY "View subscription plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

-- Subscriptions viewable by org members
CREATE POLICY "View org subscription" ON public.subscriptions
    FOR SELECT USING (organization_id = get_auth_org_id());

-- Invoices viewable by org members
CREATE POLICY "View org invoices" ON public.invoices
    FOR SELECT USING (organization_id = get_auth_org_id());

-- Payment methods viewable by org members
CREATE POLICY "View org payment methods" ON public.payment_methods
    FOR SELECT USING (organization_id = get_auth_org_id());

-- Usage logs viewable by org members
CREATE POLICY "View org usage" ON public.usage_logs
    FOR SELECT USING (organization_id = get_auth_org_id());

-- 10. SEED DEFAULT SUBSCRIPTION PLANS
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

-- 11. MIGRATE EXISTING ORGANIZATIONS TO FREE PLAN
-- Create subscriptions for existing organizations
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

-- 12. HELPER FUNCTION: Get current subscription for organization
CREATE OR REPLACE FUNCTION public.get_org_subscription(org_id UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_name TEXT,
    plan_slug TEXT,
    status subscription_status,
    features JSONB,
    current_period_end TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        s.id,
        sp.name,
        sp.slug,
        s.status,
        sp.features,
        s.current_period_end
    FROM public.subscriptions s
    JOIN public.subscription_plans sp ON s.plan_id = sp.id
    WHERE s.organization_id = org_id
    ORDER BY s.created_at DESC
    LIMIT 1;
$$;

-- 13. HELPER FUNCTION: Check feature quota
CREATE OR REPLACE FUNCTION public.check_feature_quota(
    org_id UUID,
    feature_key TEXT,
    current_usage INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    feature_limit INTEGER;
    subscription_features JSONB;
BEGIN
    -- Get current subscription features
    SELECT features INTO subscription_features
    FROM public.get_org_subscription(org_id);
    
    IF subscription_features IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get feature limit (-1 means unlimited)
    feature_limit := (subscription_features->>feature_key)::INTEGER;
    
    IF feature_limit = -1 THEN
        RETURN true;
    END IF;
    
    RETURN current_usage < feature_limit;
END;
$$;

-- 14. FUNCTION: Generate invoice number
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

-- 15. TRIGGER: Auto-generate invoice number
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
