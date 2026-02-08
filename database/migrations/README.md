# Migration History

## Overview

This directory contains archived migrations that have been successfully applied to the database. These files are kept for historical reference and troubleshooting.

## Applied Migrations

### Schema Creation & Updates

- `CREATE_PROJECTS_TABLE.sql` - Initial projects table creation
- `CREATE_CAMPAIGNS_TABLE.sql` - Initial campaigns table creation
- `CREATE_WEBSOCKET_SERVERS.sql` - WebSocket servers table
- `ADD_PROJECT_IMAGE_COLUMN.sql` - Added image columns to projects
- `ADD_NOTES_TO_CALL_LOGS.sql` - Added notes field to call logs
- `UPDATE_CAMPAIGNS_SCHEMA.sql` - Campaign schema updates

### RLS & Security Fixes

- `FIX_RLS_POLICIES.sql` - RLS policy corrections
- `FIX_RLS_RECURSION_FINAL.sql` - Fixed RLS recursion issues
- `DISABLE_RLS_CALL_LOGS.sql` - Temporarily disabled RLS for debugging

### Data Fixes

- `FIX_BROKEN_USERS.sql` - User data corrections (v1)
- `FIX_BROKEN_USERS_V2.sql` - User data corrections (v2)
- `FIX_PROFILE_ISSUE.sql` - Profile data fixes
- `FIX_YOUR_USER.sql` - Specific user fixes
- `FIX_SCHEMA_MISMATCH.sql` - Schema consistency fixes

### Major Migrations

- `COMPLETE_MIGRATION.sql` - Comprehensive schema migration
- `ONE_SHOT_FIX.sql` - One-time data fix
- `migration_platform_org_split.sql` - Platform/organization separation
- `organization_profiles.sql` - Organization profile setup

## Migration Guidelines

### Creating New Migrations

1. **Use descriptive names**: `VERB_NOUN_DESCRIPTION.sql`
   - Examples: `ADD_COLUMN_user_avatar.sql`, `FIX_DATA_lead_scores.sql`

2. **Include rollback instructions**: Add comments for reverting changes

   ```sql
   -- Migration: Add user avatar column
   -- Rollback: ALTER TABLE profiles DROP COLUMN avatar_url;
   
   ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
   ```

3. **Test in development first**: Always test migrations before production

4. **Use transactions**: Wrap migrations in transactions when possible

   ```sql
   BEGIN;
   -- Your migration here
   COMMIT;
   ```

### Applying Migrations

**Using Supabase MCP:**

```javascript
await mcp_supabase_apply_migration({
  project_id: 'your-project-id',
  name: 'migration_name',
  query: '-- SQL here'
});
```

**Manual Application:**

1. Connect to database
2. Run migration SQL
3. Verify changes
4. Move file to `applied/` directory

### Best Practices

- **Backup first**: Always backup before major migrations
- **Incremental changes**: Small, focused migrations are better
- **Document purpose**: Include comments explaining why
- **Test rollback**: Ensure you can undo if needed
- **Version control**: Commit migrations to git

## Current Schema

For the current database schema, see:

- [Schema Documentation](../docs/schema/)
- [schema.sql](../schema.sql) - Complete schema export

## Troubleshooting

If you encounter migration issues:

1. **Check SYSTEM_DIAGNOSTIC.sql**: Run diagnostics
2. **Review RLS policies**: Ensure policies aren't blocking
3. **Check constraints**: Verify foreign keys and constraints
4. **Use admin client**: Bypass RLS for migrations

## Notes

> [!WARNING]
>
> - Never modify files in this directory
> - These are historical records only
> - For current schema, see `schema.sql`

> [!IMPORTANT]
>
> - All migrations here have been applied
> - Do not re-run these migrations
> - Reference only for troubleshooting
