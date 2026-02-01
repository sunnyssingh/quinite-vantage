-- Add due_time column to lead_tasks table
ALTER TABLE lead_tasks 
ADD COLUMN IF NOT EXISTS due_time TEXT;

-- Add comment
COMMENT ON COLUMN lead_tasks.due_time IS 'Time in HH:MM format for the task due time';
