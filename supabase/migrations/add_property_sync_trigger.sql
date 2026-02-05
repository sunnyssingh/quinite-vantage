-- Migration: Add automatic property-project sync trigger
-- This trigger automatically updates project unit counts when property status changes

-- Function to sync property status changes to project metrics
CREATE OR REPLACE FUNCTION sync_project_units()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if property is linked to a project
  IF NEW.project_id IS NOT NULL THEN
    -- Recalculate project unit counts based on actual property statuses
    UPDATE projects SET
      sold_units = (
        SELECT COUNT(*) FROM properties 
        WHERE project_id = NEW.project_id AND status = 'sold'
      ),
      reserved_units = (
        SELECT COUNT(*) FROM properties 
        WHERE project_id = NEW.project_id AND status = 'reserved'
      ),
      available_units = GREATEST(0, total_units - (
        SELECT COUNT(*) FROM properties 
        WHERE project_id = NEW.project_id AND status IN ('sold', 'reserved')
      ))
    WHERE id = NEW.project_id;
  END IF;
  
  -- Also handle old project_id if it changed
  IF TG_OP = 'UPDATE' AND OLD.project_id IS NOT NULL AND OLD.project_id != NEW.project_id THEN
    UPDATE projects SET
      sold_units = (
        SELECT COUNT(*) FROM properties 
        WHERE project_id = OLD.project_id AND status = 'sold'
      ),
      reserved_units = (
        SELECT COUNT(*) FROM properties 
        WHERE project_id = OLD.project_id AND status = 'reserved'
      ),
      available_units = GREATEST(0, total_units - (
        SELECT COUNT(*) FROM properties 
        WHERE project_id = OLD.project_id AND status IN ('sold', 'reserved')
      ))
    WHERE id = OLD.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE operations
DROP TRIGGER IF EXISTS property_status_sync ON properties;
CREATE TRIGGER property_status_sync
AFTER INSERT OR UPDATE OF status, project_id ON properties
FOR EACH ROW
EXECUTE FUNCTION sync_project_units();

-- Create trigger for DELETE operations
CREATE OR REPLACE FUNCTION sync_project_units_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.project_id IS NOT NULL THEN
    UPDATE projects SET
      sold_units = (
        SELECT COUNT(*) FROM properties 
        WHERE project_id = OLD.project_id AND status = 'sold'
      ),
      reserved_units = (
        SELECT COUNT(*) FROM properties 
        WHERE project_id = OLD.project_id AND status = 'reserved'
      ),
      available_units = GREATEST(0, total_units - (
        SELECT COUNT(*) FROM properties 
        WHERE project_id = OLD.project_id AND status IN ('sold', 'reserved')
      ))
    WHERE id = OLD.project_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS property_delete_sync ON properties;
CREATE TRIGGER property_delete_sync
AFTER DELETE ON properties
FOR EACH ROW
EXECUTE FUNCTION sync_project_units_on_delete();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_project_status ON properties(project_id, status);
