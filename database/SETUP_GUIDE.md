# Database Setup Guide

This guide will help you set up the database schema for the Quinite Vantage application.

## Prerequisites

- Access to your Supabase project dashboard
- Supabase SQL Editor access
- Service role key configured in `.env`

## Step 1: Run Core Schema

If you haven't already, run the main schema file first:

```bash
# File: database/schema.sql
```

This creates the core tables:
- `organizations`
- `profiles`
- `roles`
- `features`
- `role_permissions`
- `user_permissions`
- `audit_logs`

## Step 2: Create Organization Profiles Table

Run the organization profiles migration:

```bash
# File: database/organization_profiles.sql
```

This will:
1. Create the `organization_profiles` table
2. Add performance indexes
3. Set up Row Level Security (RLS) policies
4. Add indexes to existing tables for better performance

### Manual Execution

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `database/organization_profiles.sql`
5. Click **Run**

### Verify Installation

Run this query to verify the table was created:

```sql
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'organization_profiles'
ORDER BY ordinal_position;
```

You should see columns:
- id
- organization_id
- sector
- business_type
- company_name
- gstin
- contact_number
- address_line_1
- address_line_2
- city
- state
- country
- pincode
- created_at
- updated_at

### Verify Indexes

Run this query to verify indexes were created:

```sql
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN (
  'organization_profiles',
  'profiles',
  'audit_logs',
  'projects',
  'campaigns'
)
ORDER BY tablename, indexname;
```

### Verify RLS Policies

Run this query to verify RLS policies:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'organization_profiles';
```

## Step 3: Verify Existing Data

Check if any users need to be migrated:

```sql
-- Check users without organizations
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.organization_id,
  p.role_id
FROM profiles p
WHERE p.organization_id IS NULL
  AND p.is_platform_admin = FALSE;
```

If you find users without organizations, you'll need to:
1. Create organizations for them manually, OR
2. Have them sign up again with the fixed signup flow

## Step 4: Test the Setup

### Test 1: Create a Test Organization Profile

```sql
-- Get a test organization ID
SELECT id, name FROM organizations LIMIT 1;

-- Insert a test profile (replace <org_id> with actual ID)
INSERT INTO organization_profiles (
  organization_id,
  sector,
  business_type,
  company_name,
  contact_number,
  address_line_1,
  city,
  state,
  pincode
) VALUES (
  '<org_id>',
  'real_estate',
  'agent',
  'Test Company',
  '+911234567890',
  '123 Test Street',
  'Mumbai',
  'Maharashtra',
  '400001'
);
```

### Test 2: Verify RLS Works

```sql
-- This should only return profiles for organizations
-- the current user has access to
SELECT * FROM organization_profiles;
```

### Test 3: Update Organization Status

```sql
-- Mark an organization as onboarded
UPDATE organizations
SET onboarding_status = 'COMPLETED'
WHERE id = '<org_id>';
```

## Troubleshooting

### Error: relation "organization_profiles" does not exist

**Solution**: Run the `database/organization_profiles.sql` migration.

### Error: permission denied for table organization_profiles

**Solution**: Check RLS policies and ensure your user has the correct role.

### Error: duplicate key value violates unique constraint

**Solution**: An organization profile already exists. Use UPDATE instead of INSERT, or delete the existing profile first.

### Performance Issues

If queries are slow:

1. Check if indexes exist:
```sql
\di organization_profiles*
```

2. Analyze query performance:
```sql
EXPLAIN ANALYZE
SELECT * FROM organization_profiles
WHERE organization_id = '<org_id>';
```

3. Rebuild indexes if needed:
```sql
REINDEX TABLE organization_profiles;
```

## Rollback

If you need to rollback the changes:

```sql
-- Drop the table and all related objects
DROP TABLE IF EXISTS organization_profiles CASCADE;

-- Remove indexes from other tables (optional)
DROP INDEX IF EXISTS idx_profiles_org_id;
DROP INDEX IF EXISTS idx_profiles_role_id;
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_audit_logs_org_id;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_projects_org_id;
DROP INDEX IF EXISTS idx_projects_created_at;
DROP INDEX IF EXISTS idx_campaigns_project_id;
DROP INDEX IF EXISTS idx_campaigns_status;
DROP INDEX IF EXISTS idx_campaigns_scheduled_at;
```

## Next Steps

After setting up the database:

1. Restart your Next.js application
2. Test the signup flow
3. Test the onboarding flow
4. Verify data is being saved correctly
5. Check audit logs are being created

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Check application logs
3. Verify environment variables are set correctly
4. Ensure service role key has proper permissions
