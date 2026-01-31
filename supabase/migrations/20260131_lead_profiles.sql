-- Lead Profiles Table
CREATE TABLE IF NOT EXISTS lead_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Company & Role Information
    company TEXT,
    job_title TEXT,
    location TEXT,
    industry TEXT,
    
    -- Lead Scoring & Qualification
    lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    engagement_level TEXT CHECK (engagement_level IN ('hot', 'warm', 'cold')) DEFAULT 'cold',
    
    -- Sales Intelligence
    budget_range TEXT,
    timeline TEXT,
    pain_points TEXT[],
    competitor_mentions TEXT[],
    
    -- Preferences & Custom Data
    preferred_contact_method TEXT,
    best_contact_time TEXT,
    preferences JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one profile per lead
    UNIQUE(lead_id)
);

-- Lead Interactions Table
CREATE TABLE IF NOT EXISTS lead_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Interaction Details
    type TEXT NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'note', 'sms', 'whatsapp')),
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    subject TEXT,
    content TEXT,
    
    -- Call/Meeting Specific
    duration INTEGER, -- in minutes
    outcome TEXT,
    
    -- Email Specific
    email_opened BOOLEAN DEFAULT FALSE,
    email_clicked BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Documents Table
CREATE TABLE IF NOT EXISTS lead_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- File Information
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER, -- in bytes
    document_type TEXT CHECK (document_type IN ('proposal', 'contract', 'brochure', 'presentation', 'other')),
    
    -- Metadata
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Tags Table
CREATE TABLE IF NOT EXISTS lead_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    tag TEXT NOT NULL,
    color TEXT DEFAULT '#6B7280',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate tags for same lead
    UNIQUE(lead_id, tag)
);

-- Lead Tasks Table
CREATE TABLE IF NOT EXISTS lead_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Task Details
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('pending', 'completed', 'overdue')) DEFAULT 'pending',
    
    -- Assignment
    assigned_to UUID REFERENCES auth.users(id),
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_lead_profiles_lead_id ON lead_profiles(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_profiles_org_id ON lead_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_profiles_score ON lead_profiles(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_profiles_engagement ON lead_profiles(engagement_level);

CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_org_id ON lead_interactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_type ON lead_interactions(type);

CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_id ON lead_documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_documents_org_id ON lead_documents(organization_id);

CREATE INDEX IF NOT EXISTS idx_lead_tags_lead_id ON lead_tags(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_org_id ON lead_tags(organization_id);

CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_org_id ON lead_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_assigned_to ON lead_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_status ON lead_tasks(status);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_due_date ON lead_tasks(due_date);

-- RLS Policies

-- Lead Profiles
ALTER TABLE lead_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead profiles in their organization"
    ON lead_profiles FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert lead profiles in their organization"
    ON lead_profiles FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update lead profiles in their organization"
    ON lead_profiles FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Lead Interactions
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interactions in their organization"
    ON lead_interactions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert interactions in their organization"
    ON lead_interactions FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Lead Documents
ALTER TABLE lead_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents in their organization"
    ON lead_documents FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert documents in their organization"
    ON lead_documents FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete documents in their organization"
    ON lead_documents FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Lead Tags
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags in their organization"
    ON lead_tags FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tags in their organization"
    ON lead_tags FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tags in their organization"
    ON lead_tags FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Lead Tasks
ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their organization"
    ON lead_tasks FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tasks in their organization"
    ON lead_tasks FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update tasks in their organization"
    ON lead_tasks FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_profiles_updated_at
    BEFORE UPDATE ON lead_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_interactions_updated_at
    BEFORE UPDATE ON lead_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
