-- Disable RLS on call_logs table for debugging purposes
ALTER TABLE call_logs DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated and service_role
GRANT ALL ON call_logs TO authenticated, service_role;
