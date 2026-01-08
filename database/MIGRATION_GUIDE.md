# 🚀 Database Migration - Quick Start Guide

## Step 1: Run the Migration

1. **Go to Supabase Dashboard**
   - Open: https://dlbxhbukzyygbabrujuv.supabase.co
   - Navigate to: **SQL Editor** (left sidebar)

2. **Create New Query**
   - Click "New Query"
   - Copy **ENTIRE contents** of `/app/database/COMPLETE_MIGRATION.sql`
   - Paste into SQL Editor
   - Click **"Run"** or press `Ctrl/Cmd + Enter`

3. **Verify Success**
   - Should see success messages in the output
   - Check for: "DATABASE MIGRATION COMPLETED!"
   - Look for verification messages about tables created

---

## Step 2: Verify Tables Created

Run this query in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected Tables:**
- ✅ organizations
- ✅ profiles
- ✅ roles
- ✅ features
- ✅ role_permissions
- ✅ user_permissions
- ✅ audit_logs
- ✅ organization_profiles
- ✅ impersonation_sessions

---

## Step 3: Verify Default Data

**Check Roles:**
```sql
SELECT * FROM roles ORDER BY name;
```

Expected: 4 roles
- Platform Admin
- Client Super Admin
- Manager
- Employee

**Check Features:**
```sql
SELECT * FROM features ORDER BY category, name;
```

Expected: 15 features across categories

**Check Role Permissions:**
```sql
SELECT r.name as role, COUNT(f.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN features f ON rp.feature_id = f.id
GROUP BY r.name
ORDER BY r.name;
```

Expected:
- Client Super Admin: 15 permissions
- Manager: 10 permissions
- Employee: 3 permissions
- Platform Admin: 0 (bypasses checks)

---

## Step 4: Create Platform Admin (Optional)

If you need a platform admin account:

```sql
-- First, create user via Supabase Dashboard → Authentication → Users
-- Then run this with the user's ID:

UPDATE profiles 
SET is_platform_admin = TRUE,
    role_id = (SELECT id FROM roles WHERE name = 'Platform Admin')
WHERE email = 'your-admin@email.com';
```

---

## Step 5: Configure Supabase Settings

1. **Go to Authentication → URL Configuration**

2. **Add Redirect URLs:**
   ```
   https://6e5ca5f8-8fae-4bf5-8e5f-8b2b651de5d6.e1.dev.codezero.emergent.app/auth/callback
   https://6e5ca5f8-8fae-4bf5-8e5f-8b2b651de5d6.e1.dev.codezero.emergent.app/**
   ```

3. **Set Site URL:**
   ```
   https://6e5ca5f8-8fae-4bf5-8e5f-8b2b651de5d6.e1.dev.codezero.emergent.app
   ```

4. **Disable Email Confirmation (for testing):**
   - Go to Authentication → Providers → Email
   - Uncheck "Enable email confirmations"

---

## Step 6: Test the Application

### Test Org User Signup:

1. Visit: http://localhost:3000 (or your preview URL)
2. Click **"Sign Up"**
3. Fill in:
   - Email: test@example.com
   - Password: test123456
   - Full Name: Test User
   - Organization: Test Corp
4. Click **"Create Account"**
5. Should redirect to **/onboarding**

### Test Onboarding:

Complete the 5-step wizard:
1. **Sector:** Select "Real Estate"
2. **Business Type:** Choose "Agent" or "Builder"
3. **Company Details:**
   - Company Name: ABC Realty
   - Contact: +91 9876543210
4. **Address:**
   - Address: 123 Main Street
   - City: Mumbai
   - State: Maharashtra
   - Pincode: 400001
5. **Review:** Click "Complete Onboarding"

Should redirect to **/dashboard**

### Test Platform Admin:

1. Create platform admin (Step 4 above)
2. Visit: http://localhost:3000/admin-login
3. Login with admin credentials
4. Should redirect to **/platform/dashboard**
5. Check purple-themed sidebar
6. Click "Organizations" to see all orgs

---

## Troubleshooting

### Issue: Tables already exist

**Solution:** Migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to re-run

### Issue: Foreign key constraints fail

**Solution:** Make sure auth.users table exists (it's created by Supabase automatically)

### Issue: Policies fail

**Solution:** Policies use `DROP POLICY IF EXISTS` before creating, safe to re-run

### Issue: Trigger already exists

**Solution:** Script uses `DROP TRIGGER IF EXISTS`, safe to re-run

### Issue: User can't login after signup

**Solution:** 
1. Check if email confirmation is required
2. Disable in: Authentication → Providers → Email
3. Or check spam folder for confirmation email

### Issue: Onboarding page shows "Only Super Admin"

**Solution:** 
```sql
-- Verify user's role
SELECT p.email, r.name as role 
FROM profiles p 
JOIN roles r ON p.role_id = r.id 
WHERE p.email = 'your@email.com';

-- Should show "Client Super Admin"
-- If not, check if onboarding completed properly
```

---

## Verification Checklist

After migration, verify:

- [ ] All 9 tables exist
- [ ] 4 roles inserted
- [ ] 15 features inserted
- [ ] Role permissions populated
- [ ] RLS policies active
- [ ] Profile trigger works (test signup)
- [ ] Can signup new org user
- [ ] Onboarding wizard appears
- [ ] Can complete onboarding
- [ ] Dashboard accessible after onboarding

---

## Quick SQL Queries for Debugging

**View all organizations:**
```sql
SELECT id, name, onboarding_status, created_at 
FROM organizations 
ORDER BY created_at DESC;
```

**View all users:**
```sql
SELECT p.email, p.full_name, r.name as role, o.name as organization
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
LEFT JOIN organizations o ON p.organization_id = o.id
ORDER BY p.created_at DESC;
```

**View organization profiles:**
```sql
SELECT 
  o.name as org_name,
  op.company_name,
  op.business_type,
  op.city,
  op.state
FROM organization_profiles op
JOIN organizations o ON op.organization_id = o.id;
```

**View audit logs:**
```sql
SELECT 
  user_name,
  action,
  entity_type,
  is_impersonated,
  created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;
```

**Check permissions for a user:**
```sql
-- Replace with actual user email
WITH user_role AS (
  SELECT role_id FROM profiles WHERE email = 'test@example.com'
)
SELECT f.name as permission
FROM role_permissions rp
JOIN features f ON rp.feature_id = f.id
WHERE rp.role_id = (SELECT role_id FROM user_role)
ORDER BY f.category, f.name;
```

---

## Need Help?

1. Check Supabase logs in dashboard
2. Check browser console for frontend errors
3. Check Next.js logs: `tail -f /var/log/supervisor/nextjs.out.log`
4. Verify environment variables in `.env`

---

## Success! 🎉

Once migration is complete and verified, your platform is ready with:
- ✅ Multi-tenant architecture
- ✅ Role-based access control
- ✅ Platform admin separation
- ✅ Onboarding workflow
- ✅ Impersonation system
- ✅ Audit logging
- ✅ Business profiles

Happy building!
