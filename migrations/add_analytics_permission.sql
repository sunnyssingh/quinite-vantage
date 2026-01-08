/* Add analytics.view_basic feature for dashboard access */

DO $$
DECLARE
  analytics_feature_id UUID;
  super_admin_role_id UUID;
  manager_role_id UUID;
  employee_role_id UUID;
BEGIN
  /* Get or create analytics.view_basic feature */
  SELECT id INTO analytics_feature_id FROM features WHERE name = 'analytics.view_basic';
  IF analytics_feature_id IS NULL THEN
    INSERT INTO features (name, description)
    VALUES ('analytics.view_basic', 'View basic analytics and dashboard')
    RETURNING id INTO analytics_feature_id;
    RAISE NOTICE 'Created analytics.view_basic feature: %', analytics_feature_id;
  ELSE
    RAISE NOTICE 'analytics.view_basic feature already exists: %', analytics_feature_id;
  END IF;

  /* Get role IDs */
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'Client Super Admin';
  SELECT id INTO manager_role_id FROM roles WHERE name = 'Manager';
  SELECT id INTO employee_role_id FROM roles WHERE name = 'Employee';

  /* Assign to all roles */
  INSERT INTO role_permissions (role_id, feature_id)
  VALUES 
    (super_admin_role_id, analytics_feature_id),
    (manager_role_id, analytics_feature_id),
    (employee_role_id, analytics_feature_id)
  ON CONFLICT (role_id, feature_id) DO NOTHING;

  RAISE NOTICE 'Assigned analytics.view_basic to all roles';
END $$;

/* Verify */
SELECT 
  r.name as role_name,
  f.name as feature_name
FROM role_permissions rp
JOIN features f ON rp.feature_id = f.id
JOIN roles r ON rp.role_id = r.id
WHERE f.name = 'analytics.view_basic'
ORDER BY r.name;
