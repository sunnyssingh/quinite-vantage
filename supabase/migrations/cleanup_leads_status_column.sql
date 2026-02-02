-- Migration: Remove redundant status and call_status columns from leads table
-- This migration ensures all leads use pipeline stages (stage_id) instead of the old status field

-- Step 1: Ensure all leads have a stage_id by migrating old status values
DO $$
DECLARE
  org_record RECORD;
  default_pipeline_id uuid;
  stage_mapping jsonb;
  new_stage_id uuid;
  contacted_stage_id uuid;
  qualified_stage_id uuid;
  converted_stage_id uuid;
  lost_stage_id uuid;
BEGIN
  -- Process each organization
  FOR org_record IN SELECT id FROM organizations LOOP
    -- Get the default pipeline for this organization
    SELECT id INTO default_pipeline_id 
    FROM pipelines 
    WHERE organization_id = org_record.id 
    AND is_default = true 
    LIMIT 1;
    
    -- Skip if no default pipeline exists
    IF default_pipeline_id IS NULL THEN
      RAISE NOTICE 'No default pipeline found for organization %', org_record.id;
      CONTINUE;
    END IF;
    
    -- Get stage IDs for mapping old status values
    -- Try to find stages by name (case-insensitive)
    SELECT id INTO new_stage_id 
    FROM pipeline_stages 
    WHERE pipeline_id = default_pipeline_id 
    AND LOWER(name) IN ('new', 'new lead', 'new leads')
    ORDER BY order_index 
    LIMIT 1;
    
    SELECT id INTO contacted_stage_id 
    FROM pipeline_stages 
    WHERE pipeline_id = default_pipeline_id 
    AND LOWER(name) IN ('contacted', 'contact made', 'in contact')
    ORDER BY order_index 
    LIMIT 1;
    
    SELECT id INTO qualified_stage_id 
    FROM pipeline_stages 
    WHERE pipeline_id = default_pipeline_id 
    AND LOWER(name) IN ('qualified', 'qualified lead')
    ORDER BY order_index 
    LIMIT 1;
    
    SELECT id INTO converted_stage_id 
    FROM pipeline_stages 
    WHERE pipeline_id = default_pipeline_id 
    AND LOWER(name) IN ('converted', 'won', 'closed won')
    ORDER BY order_index DESC 
    LIMIT 1;
    
    SELECT id INTO lost_stage_id 
    FROM pipeline_stages 
    WHERE pipeline_id = default_pipeline_id 
    AND LOWER(name) IN ('lost', 'closed lost', 'disqualified')
    ORDER BY order_index DESC 
    LIMIT 1;
    
    -- If we don't have a "new" stage, use the first stage in the pipeline
    IF new_stage_id IS NULL THEN
      SELECT id INTO new_stage_id 
      FROM pipeline_stages 
      WHERE pipeline_id = default_pipeline_id 
      ORDER BY order_index 
      LIMIT 1;
    END IF;
    
    -- Update leads based on their current status
    -- Map 'new' status to new_stage_id
    UPDATE leads 
    SET stage_id = new_stage_id 
    WHERE organization_id = org_record.id 
    AND stage_id IS NULL 
    AND (status = 'new' OR status IS NULL);
    
    -- Map 'contacted' status
    IF contacted_stage_id IS NOT NULL THEN
      UPDATE leads 
      SET stage_id = contacted_stage_id 
      WHERE organization_id = org_record.id 
      AND stage_id IS NULL 
      AND status = 'contacted';
    END IF;
    
    -- Map 'qualified' status
    IF qualified_stage_id IS NOT NULL THEN
      UPDATE leads 
      SET stage_id = qualified_stage_id 
      WHERE organization_id = org_record.id 
      AND stage_id IS NULL 
      AND status = 'qualified';
    END IF;
    
    -- Map 'converted' status
    IF converted_stage_id IS NOT NULL THEN
      UPDATE leads 
      SET stage_id = converted_stage_id 
      WHERE organization_id = org_record.id 
      AND stage_id IS NULL 
      AND status = 'converted';
    END IF;
    
    -- Map 'lost' status
    IF lost_stage_id IS NOT NULL THEN
      UPDATE leads 
      SET stage_id = lost_stage_id 
      WHERE organization_id = org_record.id 
      AND stage_id IS NULL 
      AND status = 'lost';
    END IF;
    
    -- Any remaining leads without stage_id get the default new stage
    UPDATE leads 
    SET stage_id = new_stage_id 
    WHERE organization_id = org_record.id 
    AND stage_id IS NULL;
    
    RAISE NOTICE 'Migrated leads for organization %', org_record.id;
  END LOOP;
END $$;

-- Step 2: Make stage_id NOT NULL (now that all leads have a stage)
ALTER TABLE public.leads 
ALTER COLUMN stage_id SET NOT NULL;

-- Step 3: Remove the redundant status column
ALTER TABLE public.leads 
DROP COLUMN IF EXISTS status;

-- Step 4: Remove the call_status column (this should be tracked in call_logs table)
ALTER TABLE public.leads 
DROP COLUMN IF EXISTS call_status;

-- Step 5: Add a comment to document the change
COMMENT ON COLUMN public.leads.stage_id IS 'Pipeline stage for this lead. References pipeline_stages table. This is the single source of truth for lead status.';

-- Step 6: Create an index on stage_id for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON public.leads USING btree (stage_id);

-- Migration complete
-- All leads now use pipeline stages exclusively via stage_id
