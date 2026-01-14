# Database Migration Cleanup - Summary

## ✅ Clean Migration Structure Created

### Active Migrations (Use These)

1. **`001_core_schema.sql`** - Core tables (leads, call_logs, campaigns, projects)
2. **`002_auth_and_organizations.sql`** - Auth & multi-tenancy setup
3. **`003_rls_policies.sql`** - Row Level Security (non-recursive)
4. **`004_cleanup_triggers.sql`** - Remove database triggers

### Archived Migrations (Moved to `_archive/`)

- `003_ensure_tables_and_rsl.sql` → Superseded by 002
- `004_fix_profiles_and_trigger.sql` → Superseded by 002
- `005_auto_create_org.sql` → Deprecated (trigger-based approach)
- `006_fix_uuid_extension.sql` → Merged into 002
- `007_cleanup_and_fix.sql` → Merged into 002
- `008_disable_trigger.sql` → Superseded by 004
- `009_kill_trigger.sql` → Superseded by 004
- `010_final_setup.sql` → Superseded by 002 + 003 + 004

## 🎯 For Your Current Database

Since you've already run various migrations, you only need to run:

```sql
-- 1. Run this to ensure all tables/columns exist
migrations/002_auth_and_organizations.sql

-- 2. Run this to fix RLS policies (drops old ones first)
migrations/003_rls_policies.sql

-- 3. Run this to remove triggers
migrations/004_cleanup_triggers.sql
```

## 📋 RLS Policy Verification

The new RLS policies are **non-recursive** and use `EXISTS` instead of `IN` subqueries to prevent infinite recursion errors.

Key improvements:

- ✅ Profiles policy defined first
- ✅ Direct `auth.uid()` checks
- ✅ No circular dependencies
- ✅ Covers all tables (organizations, profiles, leads, call_logs, audit_logs)

## 🗂️ File Organization

**Keep:**

- `001_core_schema.sql` - Core business tables
- `002_auth_and_organizations.sql` - Auth infrastructure  
- `003_rls_policies.sql` - Security policies
- `004_cleanup_triggers.sql` - Trigger cleanup
- `README.md` - Migration guide

**Archive:** (in `_archive/` folder)

- All numbered migrations 003-010 (old versions)

**Other files:** (existing business logic migrations - keep as-is)

- `add_*.sql` - Feature additions
- `create_*.sql` - Table creations
- `enable_*.sql` - Feature enables
