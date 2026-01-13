-- ============================================
-- FIX UUID EXTENSION & VERIFY SETUP
-- ============================================

-- 1. Ensure encryption extension exists (often needed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure UUID extension exists (Critical for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- 3. Verify Roles
DO $$
BEGIN
    INSERT INTO public.roles (name, description)
    VALUES ('Client Super Admin', 'Full access to organization resources')
    ON CONFLICT (name) DO NOTHING;
END $$;
