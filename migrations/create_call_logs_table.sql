-- Call Logs Table Migration
-- Creates table to track all AI agent calls made during campaigns

-- Create call_logs table
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  campaign_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  
  -- Call details
  call_status TEXT NOT NULL,
  transferred BOOLEAN DEFAULT FALSE,
  call_timestamp TIMESTAMPTZ DEFAULT NOW(),
  duration INTEGER DEFAULT 0, -- simulated call duration in seconds
  
  -- Additional info
  notes TEXT,
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT call_logs_campaign_id_fkey FOREIGN KEY (campaign_id) 
    REFERENCES campaigns(id) ON DELETE CASCADE,
  CONSTRAINT call_logs_lead_id_fkey FOREIGN KEY (lead_id) 
    REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT call_logs_status_check CHECK (
    call_status IN ('called', 'transferred', 'no_answer', 'voicemail')
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_logs_campaign 
  ON public.call_logs(campaign_id);

CREATE INDEX IF NOT EXISTS idx_call_logs_lead 
  ON public.call_logs(lead_id);

CREATE INDEX IF NOT EXISTS idx_call_logs_timestamp 
  ON public.call_logs(call_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_call_logs_transferred 
  ON public.call_logs(transferred) WHERE transferred = TRUE;

-- Verify table creation
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'call_logs'
ORDER BY ordinal_position;
