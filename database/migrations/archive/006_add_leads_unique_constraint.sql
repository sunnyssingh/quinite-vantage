-- Migration 006: Add Unique Constraint for Leads Upsert
-- Required for the Ingestion API to handle 'onConflict' correctly.

-- Ensure we only have one lead per phone number per project.
-- This prevents duplicates when importing from CSV or APIs.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leads_phone_project_unique'
    ) THEN
        ALTER TABLE leads 
        ADD CONSTRAINT leads_phone_project_unique UNIQUE (phone, project_id);
    END IF;
END $$;
