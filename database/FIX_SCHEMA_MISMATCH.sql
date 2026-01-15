-- FIX_SCHEMA_MISMATCH.sql
-- Aligns the database schema with the application code requirements.
-- The application relies on 'call_sid' to track Plivo calls and other columns.

-- 1. Fix call_logs table
ALTER TABLE public.call_logs
  ADD COLUMN IF NOT EXISTS call_sid TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound',
  ADD COLUMN IF NOT EXISTS caller_number TEXT,
  ADD COLUMN IF NOT EXISTS callee_number TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS call_status TEXT; -- Code uses 'call_status', schema had 'status'

-- If 'status' exists but 'call_status' was missing, migrate data if needed (optional)
-- UPDATE call_logs SET call_status = status WHERE call_status IS NULL;

-- 2. Fix leads table (if metadata is missing)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS transferred_to_human BOOLEAN DEFAULT FALSE;

-- 3. Ensure RLS policies allow insertion (Code runs as admin client usually, but good to have)
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.call_logs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.call_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on email" ON public.call_logs
    FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Fix websocket_servers (User requested earlier, ensure it exists)
CREATE TABLE IF NOT EXISTS websocket_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending',
  last_verified_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
