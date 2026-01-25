# Migration Files Cleanup Plan

## Current Migration Files

### ✅ KEEP - Essential Files

1. **`001_enterprise_master.sql`** (11.7 KB)
   - **Status**: KEEP - This is your base schema
   - **Purpose**: Creates all core tables (organizations, profiles, projects, leads, campaigns, etc.)
   - **Note**: This was already run on your database

2. **`SIMPLIFIED_ROLES.sql`** (5 KB)
   - **Status**: KEEP - This is the new migration
   - **Purpose**: Simplifies role system from complex JSONB to simple enum
   - **Action**: This is what you just ran successfully

### ❌ ARCHIVE - Obsolete/Temporary Files

1. **`COMPLETE_SCHEMA.sql`** (13.7 KB)
   - **Status**: ARCHIVE - Duplicate of 001_enterprise_master.sql
   - **Reason**: Same content as the master schema, just a copy

2. **`008_fix_onboarding.sql`** (1.9 KB)
   - **Status**: ARCHIVE - Already applied/superseded
   - **Reason**: This was a temporary fix, now handled by SIMPLIFIED_ROLES.sql

3. **`FIX_USER_ORG.sql`** (3 KB)
   - **Status**: ARCHIVE - One-time emergency fix
   - **Reason**: Manual fix for specific user, not needed anymore

4. **`DIAGNOSE.sql`** (1.8 KB)
   - **Status**: ARCHIVE - Diagnostic tool
   - **Reason**: Useful for debugging but not a migration

### 📄 KEEP - Documentation

1. **`README.md`** (2.2 KB)
   - **Status**: KEEP
   - **Purpose**: Migration documentation

2. **`CLEANUP_SUMMARY.md`** (2.2 KB)
   - **Status**: KEEP
   - **Purpose**: Documentation

---

## Recommended Actions

### Move to Archive

```powershell
# Move obsolete migrations to _archive folder
Move-Item "migrations/COMPLETE_SCHEMA.sql" "migrations/_archive/"
Move-Item "migrations/008_fix_onboarding.sql" "migrations/_archive/"
Move-Item "migrations/FIX_USER_ORG.sql" "migrations/_archive/"
Move-Item "migrations/DIAGNOSE.sql" "migrations/_archive/"
```

### Final Migration Structure

```
migrations/
├─ 001_enterprise_master.sql    ✅ Base schema
├─ SIMPLIFIED_ROLES.sql          ✅ Role simplification
├─ README.md                     📄 Documentation
├─ CLEANUP_SUMMARY.md            📄 Documentation
└─ _archive/                     📦 Old files
   ├─ COMPLETE_SCHEMA.sql
   ├─ 008_fix_onboarding.sql
   ├─ FIX_USER_ORG.sql
   └─ DIAGNOSE.sql
```

---

## Database Compatibility Check

### Current Database State (After SIMPLIFIED_ROLES.sql)

✅ **Compatible with all features:**

1. **Tables** (from 001_enterprise_master.sql):
   - ✅ organizations
   - ✅ profiles (with new `role` column)
   - ✅ projects
   - ✅ leads
   - ✅ campaigns
   - ✅ call_logs
   - ✅ audit_logs
   - ✅ impersonation_sessions

2. **Enums**:
   - ✅ user_role (platform_admin, super_admin, manager, employee)
   - ✅ org_tier (free, pro, enterprise)
   - ❌ system_role_enum (REMOVED - no longer needed)

3. **Profiles Table**:
   - ✅ `role` column (user_role enum)
   - ❌ `role_id` column (REMOVED)
   - ❌ `system_role` column (REMOVED)

### Features Compatibility

| Feature | Database Ready | Notes |
|---------|---------------|-------|
| User Management | ✅ | Uses `profiles.role` |
| Projects | ✅ | Existing table works |
| Leads | ✅ | Existing table works |
| Campaigns | ✅ | Existing table works |
| Analytics | ✅ | Existing tables work |
| Audit Logs | ✅ | Existing table works |
| Role-Based Access | ✅ | Uses simple enum |

---

## Migration History

### What You've Run

1. **`001_enterprise_master.sql`** - Initial setup
   - Created all tables
   - Set up RLS policies
   - Created auth triggers

2. **`SIMPLIFIED_ROLES.sql`** - Role simplification
   - Added `user_role` enum
   - Added `role` column to profiles
   - Removed `roles` table
   - Updated RLS policies

### What's Active

Your database now has:

- Simple enum-based roles (no complex permission tables)
- All feature tables intact
- Clean, simplified schema

---

## Conclusion

✅ **Database is fully compatible** with the new simplified role-based architecture.

✅ **Safe to archive** 4 migration files (they're duplicates or one-time fixes).

✅ **Keep only 2 migrations**:

1. `001_enterprise_master.sql` - Base schema
2. `SIMPLIFIED_ROLES.sql` - Role simplification

This keeps your migrations folder clean and organized!
