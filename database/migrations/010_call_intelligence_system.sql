-- ==============================================================================
-- MIGRATION 010: Call Intelligence System (India Edition)
-- Description: Agent tracking, sentiment analysis, follow-ups
-- ==============================================================================

BEGIN;

-- 1. AGENT CALLS TABLE
CREATE TABLE IF NOT EXISTS public.agent_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    ai_call_log_id UUID REFERENCES public.call_logs(id) ON DELETE SET NULL,
    
    -- Agent Info
    agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    agent_name TEXT,
    
    -- Call Details
    call_sid TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration INTEGER, -- seconds
    recording_url TEXT,
    transcript TEXT,
    
    -- Outcome
    outcome TEXT, -- 'scheduled', 'interested', 'not_interested', 'callback', 'closed', 'no_answer'
    next_action TEXT,
    next_action_date TIMESTAMPTZ,
    
    -- Notes & Analysis
    agent_notes TEXT,
    sentiment_score DECIMAL(3, 2), -- -1.00 to 1.00
    interest_level TEXT, -- 'high', 'medium', 'low'
    objections JSONB DEFAULT '[]',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_calls_lead_id ON public.agent_calls(lead_id);
CREATE INDEX idx_agent_calls_agent_id ON public.agent_calls(agent_id);
CREATE INDEX idx_agent_calls_outcome ON public.agent_calls(outcome);

-- 2. CALL ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.call_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    call_log_id UUID REFERENCES public.call_logs(id) ON DELETE SET NULL,
    
    -- Attempt Details
    attempt_number INTEGER NOT NULL,
    channel TEXT NOT NULL, -- 'voice_ai', 'voice_agent', 'sms'
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Outcome
    outcome TEXT NOT NULL, -- 'answered', 'no_answer', 'busy', 'voicemail', 'failed'
    duration INTEGER DEFAULT 0,
    
    -- Retry Logic
    will_retry BOOLEAN DEFAULT false,
    next_retry_at TIMESTAMPTZ,
    retry_reason TEXT,
    
    -- Detection
    voicemail_detected BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_call_attempts_lead_id ON public.call_attempts(lead_id);
CREATE INDEX idx_call_attempts_next_retry ON public.call_attempts(next_retry_at) WHERE will_retry = true;

-- 3. CONVERSATION INSIGHTS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    call_log_id UUID REFERENCES public.call_logs(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    
    -- Sentiment Analysis
    overall_sentiment DECIMAL(3, 2), -- -1.00 to 1.00
    sentiment_label TEXT,
    
    -- Emotion & Intent
    primary_emotion TEXT,
    intent TEXT,
    interest_level TEXT,
    
    -- Objections & Info
    objections JSONB DEFAULT '[]',
    budget_mentioned BOOLEAN DEFAULT false,
    budget_range TEXT,
    timeline_mentioned BOOLEAN DEFAULT false,
    timeline TEXT,
    
    -- Keywords
    key_phrases JSONB DEFAULT '[]',
    
    -- AI Recommendations
    recommended_action TEXT,
    priority_score INTEGER, -- 0-100
    
    -- Metadata
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_lead_id ON public.conversation_insights(lead_id);
CREATE INDEX idx_insights_priority_score ON public.conversation_insights(priority_score DESC);

-- 4. FOLLOW-UP TASKS TABLE
CREATE TABLE IF NOT EXISTS public.follow_up_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    
    -- Assignment
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Task Details
    task_type TEXT NOT NULL, -- 'call', 'sms', 'meeting', 'site_visit'
    title TEXT NOT NULL,
    description TEXT,
    
    -- Priority & Timing
    priority TEXT NOT NULL DEFAULT 'medium', -- 'urgent', 'high', 'medium', 'low'
    due_date TIMESTAMPTZ NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    completed_at TIMESTAMPTZ,
    
    -- Context
    context TEXT,
    ai_suggestion TEXT,
    source TEXT DEFAULT 'manual',
    
    -- Outcome
    outcome TEXT,
    outcome_notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_lead_id ON public.follow_up_tasks(lead_id);
CREATE INDEX idx_tasks_assigned_to ON public.follow_up_tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.follow_up_tasks(status);
CREATE INDEX idx_tasks_due_date ON public.follow_up_tasks(due_date);

-- 5. ENHANCE EXISTING TABLES

-- Add to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS interest_level TEXT,
ADD COLUMN IF NOT EXISTS purchase_readiness TEXT,
ADD COLUMN IF NOT EXISTS budget_range TEXT,
ADD COLUMN IF NOT EXISTS total_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sentiment_score DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_leads_interest_level ON public.leads(interest_level);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(score DESC);

-- Add to call_logs table
ALTER TABLE public.call_logs
ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS interest_level TEXT,
ADD COLUMN IF NOT EXISTS conversation_summary TEXT;

-- Add to campaigns table
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS total_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS answered_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS transferred_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_sentiment_score DECIMAL(3, 2);

-- 6. HELPER FUNCTIONS

CREATE OR REPLACE FUNCTION public.calculate_lead_score(lead_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    score INTEGER := 0;
    lead_record RECORD;
    latest_insight RECORD;
BEGIN
    SELECT * INTO lead_record FROM public.leads WHERE id = lead_uuid;
    
    SELECT * INTO latest_insight 
    FROM public.conversation_insights 
    WHERE lead_id = lead_uuid 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Engagement (40 points)
    IF lead_record.total_calls > 0 THEN score := score + 10; END IF;
    IF lead_record.total_calls > 2 THEN score := score + 10; END IF;
    IF lead_record.last_sentiment_score > 0.5 THEN score := score + 20; END IF;
    
    -- Interest (30 points)
    IF latest_insight.interest_level = 'high' THEN score := score + 30;
    ELSIF latest_insight.interest_level = 'medium' THEN score := score + 15;
    END IF;
    
    -- Readiness (30 points)
    IF lead_record.purchase_readiness = 'immediate' THEN score := score + 30;
    ELSIF lead_record.purchase_readiness = 'short_term' THEN score := score + 20;
    END IF;
    
    RETURN LEAST(score, 100);
END;
$$;

-- 7. TRIGGERS

CREATE OR REPLACE FUNCTION update_lead_score_after_insight()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.leads
    SET 
        score = calculate_lead_score(NEW.lead_id),
        interest_level = NEW.interest_level,
        last_sentiment_score = NEW.overall_sentiment
    WHERE id = NEW.lead_id;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_score_on_insight
    AFTER INSERT ON public.conversation_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_score_after_insight();

-- 8. RLS POLICIES

ALTER TABLE public.agent_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org agent calls" ON public.agent_calls FOR SELECT 
    USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org agent calls" ON public.agent_calls FOR ALL 
    USING (organization_id = get_auth_org_id());

CREATE POLICY "View org call attempts" ON public.call_attempts FOR SELECT 
    USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org call attempts" ON public.call_attempts FOR ALL 
    USING (organization_id = get_auth_org_id());

CREATE POLICY "View org insights" ON public.conversation_insights FOR SELECT 
    USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org insights" ON public.conversation_insights FOR ALL 
    USING (organization_id = get_auth_org_id());

CREATE POLICY "View org tasks" ON public.follow_up_tasks FOR SELECT 
    USING (organization_id = get_auth_org_id());
CREATE POLICY "Manage org tasks" ON public.follow_up_tasks FOR ALL 
    USING (organization_id = get_auth_org_id());

COMMIT;
