-- WebSocket Servers Table for Dynamic Management and Verification

CREATE TABLE IF NOT EXISTS websocket_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- e.g., "Primary US-East", "Backup Server"
  url TEXT NOT NULL UNIQUE, -- wss:// or ws:// URL
  is_active BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending', -- 'verified', 'failed', 'pending'
  last_verified_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  priority INTEGER DEFAULT 0, -- 0 = Highest priority
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE websocket_servers ENABLE ROW LEVEL SECURITY;

-- Policies (Restricted to Platform Admins effectively, or all authenticated for reading)
-- For now, let's allow authenticated users to read (needed for making calls)
CREATE POLICY "Authenticated users can read active servers"
  ON websocket_servers FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- Only Platform Admins can manage (using service_role usually, but let's add specific policy)
-- Assuming is_platform_admin check in profiles
CREATE POLICY "Platform admins can manage servers"
  ON websocket_servers
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_platform_admin = TRUE
    )
  );

-- Index for fast lookup of active servers
CREATE INDEX IF NOT EXISTS idx_websocket_servers_active ON websocket_servers(is_active, priority);
