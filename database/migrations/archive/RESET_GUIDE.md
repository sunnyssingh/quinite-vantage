# Database Reset Guide

## ⚠️ WARNING

**This will delete ALL data from your database!**

Use this only if you want to start completely fresh while keeping your schema intact.

---

## 🎯 What This Does

**Deletes:**

- ✅ All organizations
- ✅ All users (auth.users + profiles)
- ✅ All projects
- ✅ All leads
- ✅ All campaigns
- ✅ All call logs
- ✅ All audit logs
- ✅ All impersonation sessions

**Keeps:**

- ✅ Database schema (tables, columns, types)
- ✅ RLS policies
- ✅ Functions and triggers
- ✅ Enums (user_role, org_tier, etc.)

---

## 📝 How to Use

### Option 1: Run the Script (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Copy the Script**
   - Open `migrations/RESET_DATA.sql`
   - Copy all content

3. **Run in SQL Editor**
   - Paste into SQL Editor
   - Click "Run"
   - Wait for completion

4. **Verify**
   - Check the verification query results
   - All tables should show 0 rows

### Option 2: Manual Deletion (Supabase UI)

1. **Go to Table Editor**
2. **For each table:**
   - Click on table
   - Select all rows
   - Click "Delete"
   - Confirm

**Order matters!** Delete in this order:

1. audit_logs
2. impersonation_sessions
3. call_logs
4. campaigns
5. leads
6. projects
7. profiles
8. organizations
9. auth.users (in Authentication tab)

---

## 🧪 After Reset - Test Fresh Signup

### Step 1: Sign Up New User

```
1. Go to your app: http://localhost:3000
2. Click "Sign Up" tab
3. Fill in:
   - Email: admin@test.com
   - Password: Test123!
   - Full Name: Admin User
   - Company: Test Company
4. Submit
```

### Step 2: Complete Onboarding

```
1. Should redirect to /onboarding
2. Fill in 5-step form:
   - Organization details
   - Industry
   - Company size
   - etc.
3. Submit
```

### Step 3: Verify Dashboard Access

```
1. Should redirect to /dashboard/admin
2. Check sidebar shows all features:
   📊 Overview
   👥 Users
   🏗️ Projects
   📞 Leads
   📢 Campaigns
   📈 Analytics
   📋 Audit Logs
   ⚙️ Settings
```

### Step 4: Check Database

```sql
-- In Supabase SQL Editor
SELECT 
  o.name as organization,
  p.email,
  p.role,
  o.onboarding_status
FROM profiles p
JOIN organizations o ON p.organization_id = o.id;

-- Should show:
-- organization: Test Company
-- email: admin@test.com
-- role: super_admin
-- onboarding_status: COMPLETED
```

---

## 🔄 Alternative: Complete Schema Reset

If you want to reset **everything** including schema:

```sql
-- Run SIMPLIFIED_ROLES.sql again
-- This will:
-- 1. Drop all tables
-- 2. Recreate schema
-- 3. Set up RLS policies
-- 4. Create triggers
```

---

## ✅ Verification Checklist

After reset, verify:

- [ ] All tables show 0 rows
- [ ] Can sign up new user
- [ ] User gets super_admin role
- [ ] Onboarding form works
- [ ] Dashboard redirects correctly
- [ ] Can invite new users
- [ ] All features accessible

---

## 🆘 Troubleshooting

### Error: "Foreign key constraint violation"

**Cause:** Trying to delete in wrong order

**Fix:** Run the script (it deletes in correct order)

### Error: "Permission denied"

**Cause:** RLS policies blocking deletion

**Fix:** Use the provided script (uses admin client)

### Users still exist after reset

**Cause:** Didn't delete from auth.users

**Fix:**

```sql
DELETE FROM auth.users;
```

---

## 📋 Quick Reference

### Reset Data Only

```bash
# Run this file:
migrations/RESET_DATA.sql
```

### Reset Everything (Schema + Data)

```bash
# Run this file:
migrations/SIMPLIFIED_ROLES.sql
```

### Check Current Data

```sql
SELECT 
  'organizations' as table_name, 
  COUNT(*) as rows 
FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM auth.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;
```

---

## 🎯 Summary

**Use `RESET_DATA.sql` when:**

- ✅ You want to delete all data
- ✅ You want to keep the schema
- ✅ You want to test fresh signup

**Use `SIMPLIFIED_ROLES.sql` when:**

- ✅ You want to reset everything
- ✅ You want to recreate schema
- ✅ You're starting completely fresh

**Safe to run:** Yes, but make sure you have backups if needed!
