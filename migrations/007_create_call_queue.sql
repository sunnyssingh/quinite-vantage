-- Migration 007: Create Call Queue System
-- Enables asynchronous call processing, retries, and rate limiting.

-- 1. Create Status Enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'queue_status') THEN
        CREATE TYPE queue_status AS ENUM ('queued', 'processing', 'completed', 'failed');
    END IF;
END $$;

-- 2. Create Queue Table
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
    UNIQUE(campaign_id, lead_id) -- Only one active queue item per lead/campaign pair
);

-- 3. Indexes for fast polling
CREATE INDEX IF NOT EXISTS idx_call_queue_poll 
ON public.call_queue(status, next_retry_at) 
WHERE status IN ('queued', 'processing');

CREATE INDEX IF NOT EXISTS idx_call_queue_campaign 
ON public.call_queue(campaign_id);

-- 4. Enable RLS (Service Role access only usually, but good practice)
ALTER TABLE public.call_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage org queue" ON public.call_queue
    FOR ALL USING (organization_id = get_auth_org_id());

