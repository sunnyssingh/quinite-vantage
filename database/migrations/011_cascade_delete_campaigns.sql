-- Migration: Add CASCADE DELETE for campaigns when project is deleted
-- Description: Updates the foreign key constraint on campaigns.project_id to CASCADE DELETE
--              This ensures when a project is deleted, all related campaigns are automatically removed
-- Note: Properties already have CASCADE DELETE from previous migration (update_properties_cascade_delete)

-- Drop the existing foreign key constraint
ALTER TABLE campaigns
DROP CONSTRAINT IF EXISTS campaigns_project_id_fkey;

-- Recreate the constraint with ON DELETE CASCADE
ALTER TABLE campaigns
ADD CONSTRAINT campaigns_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES projects(id)
ON DELETE CASCADE;

-- Verify the constraint was updated
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'campaigns'
    AND kcu.column_name = 'project_id';
