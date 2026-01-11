
-- Add missing lead permissions
INSERT INTO features (name, description, category) VALUES
  ('leads.create', 'Manually create new leads', 'leads'),
  ('leads.delete', 'Delete existing leads', 'leads')
ON CONFLICT (name) DO NOTHING;

-- Grant to Client Super Admin (All features)
INSERT INTO role_permissions (role_id, feature_id)
SELECT r.id, f.id
FROM roles r
CROSS JOIN features f
WHERE r.name = 'Client Super Admin'
  AND f.name IN ('leads.create', 'leads.delete')
ON CONFLICT (role_id, feature_id) DO NOTHING;

-- Grant to Manager (Usually managers can create/delete leads too)
INSERT INTO role_permissions (role_id, feature_id)
SELECT r.id, f.id
FROM roles r
CROSS JOIN features f
WHERE r.name = 'Manager'
  AND f.name IN ('leads.create', 'leads.delete')
ON CONFLICT (role_id, feature_id) DO NOTHING;
