-- Migration: Add missing columns to call_logs table
-- This adds fields needed for proper call tracking and logging

-- Add missing columns
ALTER TABLE public.call_logs 
ADD COLUMN IF NOT EXISTS call_sid TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound',
ADD COLUMN IF NOT EXISTS caller_number TEXT,
ADD COLUMN IF NOT EXISTS callee_number TEXT,
ADD COLUMN IF NOT EXISTS call_status TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS transferred BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS transfer_reason TEXT,
ADD COLUMN IF NOT EXISTS transfer_department TEXT,
ADD COLUMN IF NOT EXISTS disconnect_reason TEXT,
ADD COLUMN IF NOT EXISTS disconnect_notes TEXT,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS conversation_transcript TEXT;

-- Rename 'transcript' to avoid confusion (if it exists)
-- conversation_transcript is the full conversation
-- transcript was the old column name
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'call_logs' 
        AND column_name = 'transcript'
        AND table_schema = 'public'
    ) THEN
        -- Copy data if transcript has content
        UPDATE public.call_logs 
        SET conversation_transcript = transcript 
        WHERE transcript IS NOT NULL AND conversation_transcript IS NULL;
        
        -- Drop old column
        ALTER TABLE public.call_logs DROP COLUMN transcript;
    END IF;
END $$;

-- Create index on call_sid for faster lookups
CREATE INDEX IF NOT EXISTS idx_call_logs_call_sid ON public.call_logs(call_sid);
CREATE INDEX IF NOT EXISTS idx_call_logs_organization_id ON public.call_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_campaign_id ON public.call_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON public.call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON public.call_logs(created_at DESC);

-- Add comment
COMMENT ON COLUMN public.call_logs.call_sid IS 'Plivo Call UUID for tracking';
COMMENT ON COLUMN public.call_logs.call_status IS 'Current status: in_progress, called, no_answer, busy, failed, transferred, disconnected';
COMMENT ON COLUMN public.call_logs.conversation_transcript IS 'Full conversation transcript from OpenAI Realtime API';
COMMENT ON COLUMN public.call_logs.disconnect_reason IS 'Reason for AI disconnect: not_interested, abusive_language, wrong_number, other';
