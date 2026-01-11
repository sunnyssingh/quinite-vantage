-- Update existing leads to link with their call_logs
-- This fixes leads that were called before the migration

UPDATE leads l
SET call_log_id = cl.id
FROM call_logs cl
WHERE l.id = cl.lead_id
  AND l.call_log_id IS NULL
  AND cl.call_status IN ('called', 'transferred');

-- Verify the update worked
SELECT 
  l.id,
  l.name,
  l.call_status,
  l.transferred_to_human,
  l.call_log_id,
  cl.call_sid,
  cl.transferred,
  cl.transferred_at
FROM leads l
LEFT JOIN call_logs cl ON l.call_log_id = cl.id
WHERE l.call_status != 'not_called'
ORDER BY l.created_at DESC
LIMIT 10;
