-- Billing & Subscription System Tables
-- Migration: 20260209_create_billing_tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- BILLING PLANS
-- =====================================================
CREATE TABLE IF NOT EXISTS billing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  module_type TEXT NOT NULL CHECK (module_type IN ('crm', 'inventory', 'analytics', 'all_modules')),
  base_price_inr DECIMAL(10,2) NOT NULL DEFAULT 0,
  per_user_price_inr DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0, -- For "all modules" bundle discount
  features JSONB DEFAULT '{}', -- Feature flags: {"csv_export": true, "advanced_analytics": true}
  max_users INTEGER, -- NULL for unlimited
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COUNTRY PRICING
-- =====================================================
CREATE TABLE IF NOT EXISTS country_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL UNIQUE, -- ISO 3166-1 alpha-2 (IN, US, GB)
  country_name TEXT NOT NULL,
  currency_code TEXT NOT NULL, -- ISO 4217 (INR, USD, GBP)
  per_user_monthly_rate DECIMAL(10,2) NOT NULL,
  call_credit_rate DECIMAL(10,2) NOT NULL, -- Cost per credit in local currency
  exchange_rate_to_inr DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ORGANIZATION SUBSCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES billing_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  user_count INTEGER NOT NULL DEFAULT 1,
  modules_enabled TEXT[] DEFAULT ARRAY['crm'], -- Array of enabled modules
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  last_billed_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- =====================================================
-- CALL CREDITS
-- =====================================================
CREATE TABLE IF NOT EXISTS call_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_purchased DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_consumed DECIMAL(10,2) NOT NULL DEFAULT 0,
  low_balance_threshold DECIMAL(10,2) DEFAULT 10.0, -- Alert when balance drops below
  last_recharged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- =====================================================
-- CREDIT TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'consumption', 'refund', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  reference_type TEXT, -- 'call', 'invoice', 'manual'
  reference_id UUID,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INVOICES
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  
  -- Line items breakdown
  subscription_amount DECIMAL(10,2) DEFAULT 0,
  credits_amount DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  
  -- Tax calculation
  tax_percentage DECIMAL(5,2) DEFAULT 18.00, -- GST for India
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'overdue', 'cancelled', 'refunded')),
  due_date TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_reference TEXT,
  
  -- Detailed line items
  line_items JSONB NOT NULL DEFAULT '[]',
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAYMENT TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  
  -- Payment gateway details
  payment_gateway TEXT NOT NULL CHECK (payment_gateway IN ('razorpay', 'stripe', 'manual')),
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  gateway_signature TEXT,
  
  -- Amount details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
  failure_reason TEXT,
  
  -- Payment method
  payment_method TEXT, -- 'card', 'upi', 'netbanking', 'wallet'
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Billing plans
CREATE INDEX idx_billing_plans_module_type ON billing_plans(module_type) WHERE is_active = true;
CREATE INDEX idx_billing_plans_active ON billing_plans(is_active);

-- Country pricing
CREATE INDEX idx_country_pricing_code ON country_pricing(country_code) WHERE is_active = true;

-- Organization subscriptions
CREATE INDEX idx_org_subscriptions_org_id ON organization_subscriptions(organization_id);
CREATE INDEX idx_org_subscriptions_status ON organization_subscriptions(status);
CREATE INDEX idx_org_subscriptions_next_billing ON organization_subscriptions(next_billing_date) WHERE status = 'active';

-- Call credits
CREATE INDEX idx_call_credits_org_id ON call_credits(organization_id);
CREATE INDEX idx_call_credits_low_balance ON call_credits(organization_id) WHERE balance < low_balance_threshold;

-- Credit transactions
CREATE INDEX idx_credit_transactions_org_id ON credit_transactions(organization_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_reference ON credit_transactions(reference_type, reference_id);

-- Invoices
CREATE INDEX idx_invoices_org_id ON invoices(organization_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status IN ('issued', 'overdue');
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- Payment transactions
CREATE INDEX idx_payment_transactions_org_id ON payment_transactions(organization_id);
CREATE INDEX idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX idx_payment_transactions_gateway_payment ON payment_transactions(gateway_payment_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all billing tables
CREATE TRIGGER update_billing_plans_updated_at BEFORE UPDATE ON billing_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_country_pricing_updated_at BEFORE UPDATE ON country_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_subscriptions_updated_at BEFORE UPDATE ON organization_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_credits_updated_at BEFORE UPDATE ON call_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Default billing plans
INSERT INTO billing_plans (name, description, module_type, base_price_inr, per_user_price_inr, features) VALUES
('CRM Starter', 'Essential CRM features for small teams', 'crm', 0, 100, '{"csv_export": false, "advanced_analytics": false}'),
('CRM Pro', 'Advanced CRM with all features', 'crm', 0, 150, '{"csv_export": true, "advanced_analytics": true}'),
('Inventory Basic', 'Basic inventory management', 'inventory', 0, 80, '{"csv_export": false, "bulk_import": false}'),
('Inventory Pro', 'Advanced inventory with analytics', 'inventory', 0, 120, '{"csv_export": true, "bulk_import": true}'),
('All Modules Bundle', 'All modules with 25% discount', 'all_modules', 0, 200, '{"csv_export": true, "advanced_analytics": true, "bulk_import": true}')
ON CONFLICT DO NOTHING;

-- Default country pricing (India)
INSERT INTO country_pricing (country_code, country_name, currency_code, per_user_monthly_rate, call_credit_rate, exchange_rate_to_inr) VALUES
('IN', 'India', 'INR', 100.00, 4.00, 1.0000),
('US', 'United States', 'USD', 1.50, 0.05, 83.0000),
('GB', 'United Kingdom', 'GBP', 1.20, 0.04, 105.0000)
ON CONFLICT (country_code) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Platform admins can see everything
CREATE POLICY "Platform admins full access to billing_plans" ON billing_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'platform_admin'
        )
    );

CREATE POLICY "Platform admins full access to country_pricing" ON country_pricing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'platform_admin'
        )
    );

-- Organization members can view their own subscription
CREATE POLICY "Organization members view own subscription" ON organization_subscriptions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Super admins can update their organization subscription
CREATE POLICY "Super admins update own subscription" ON organization_subscriptions
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Organization members can view their credits
CREATE POLICY "Organization members view own credits" ON call_credits
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Organization members can view their credit transactions
CREATE POLICY "Organization members view own transactions" ON credit_transactions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Organization members can view their invoices
CREATE POLICY "Organization members view own invoices" ON invoices
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Organization members can view their payments
CREATE POLICY "Organization members view own payments" ON payment_transactions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Comments for documentation
COMMENT ON TABLE billing_plans IS 'Defines available subscription plans and pricing tiers';
COMMENT ON TABLE country_pricing IS 'Country-specific pricing and currency rates';
COMMENT ON TABLE organization_subscriptions IS 'Active subscriptions for organizations';
COMMENT ON TABLE call_credits IS 'Call credit balances for organizations (4 Rupees = 1 Credit = 1 Minute)';
COMMENT ON TABLE credit_transactions IS 'Audit log of all credit purchases and consumption';
COMMENT ON TABLE invoices IS 'Monthly invoices for post-paid billing';
COMMENT ON TABLE payment_transactions IS 'Payment gateway transaction records';
