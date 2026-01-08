# 🚀 SETUP GUIDE - Multi-Tenant SaaS Platform

## ⚠️ IMPORTANT: Complete These Steps Before Testing

### Step 1: Run Database Migration ✅

**You MUST run the SQL migration in your Supabase dashboard before the application will work.**

1. Go to your Supabase Dashboard: https://dlbxhbukzyygbabrujuv.supabase.co
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy the **ENTIRE contents** of `/app/database/schema.sql`
5. Paste into the SQL Editor
6. Click **"Run"** or press `Ctrl/Cmd + Enter`

**What this does:**
- Creates all database tables (organizations, profiles, roles, features, permissions, audit_logs)
- Sets up Row Level Security policies
- Pre-populates roles: Platform Admin, Client Super Admin, Manager, Employee
- Pre-populates 15 permission features
- Assigns default permissions to each role
- Creates automatic profile creation trigger

✅ **Expected Result:** Query should complete successfully with "Success. No rows returned"

---

### Step 2: Configure Supabase Redirect URLs ✅

1. Go to your Supabase Dashboard: https://dlbxhbukzyygbabrujuv.supabase.co
2. Navigate to **Authentication** → **URL Configuration**
3. Add these **Redirect URLs**:

```
https://6e5ca5f8-8fae-4bf5-8e5f-8b2b651de5d6.e1.dev.codezero.emergent.app/auth/callback
https://6e5ca5f8-8fae-4bf5-8e5f-8b2b651de5d6.e1.dev.codezero.emergent.app/**
```

4. Add this to **Site URL** (if needed):
```
https://6e5ca5f8-8fae-4bf5-8e5f-8b2b651de5d6.e1.dev.codezero.emergent.app
```

---

### Step 3: Create Platform Admin (Optional) 🔐

Platform Admin accounts cannot sign up through the UI. Create manually:

**Option A: Via Supabase Dashboard**
1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter email and password
4. Click **"Create user"**
5. Copy the User ID
6. Go to **SQL Editor** and run:
```sql
UPDATE profiles 
SET is_platform_admin = TRUE, 
    role_id = (SELECT id FROM roles WHERE name = 'Platform Admin')
WHERE id = 'PASTE_USER_ID_HERE';
```

**Option B: Via SQL (All-in-one)**
```sql
-- This won't work unless you have the service_role key configured
-- Use Option A instead
```

---

### Step 4: Test the Application 🧪

#### Test Regular User Signup
1. Visit: https://6e5ca5f8-8fae-4bf5-8e5f-8b2b651de5d6.e1.dev.codezero.emergent.app
2. Click **"Sign Up"** tab
3. Fill in:
   - Full Name: Test User
   - Organization Name: Test Corp
   - Email: test@example.com
   - Password: test123456
4. Click **"Create Account"**
5. Wait for 3-step process:
   - Step 1: Create auth account
   - Step 2: Sign in
   - Step 3: Run onboarding (creates org)
6. Should redirect to dashboard

✅ **Expected:**
- User created in auth.users
- Profile created in profiles table
- Organization "Test Corp" created
- User assigned as "Client Super Admin"
- Audit log entry: "ORG_CREATED"

⚠️ **Note**: The onboarding now uses a 3-step process:
1. `/api/auth/signup` - Creates auth account
2. `/api/auth/signin` - Logs in to get session
3. `/api/onboard` - Creates organization (uses SERVICE ROLE)

#### Test Regular User Login
1. Visit: https://6e5ca5f8-8fae-4bf5-8e5f-8b2b651de5d6.e1.dev.codezero.emergent.app
2. Enter email and password
3. Click **"Sign In"**
4. Should see dashboard with sidebar

#### Test Platform Admin Login
1. Visit: https://6e5ca5f8-8fae-4bf5-8e5f-8b2b651de5d6.e1.dev.codezero.emergent.app/admin-login
2. Enter platform admin email and password
3. Should see dashboard with "Platform Admin" badge
4. Should have access to all pages

---

## 📋 Quick Verification Checklist

After completing setup, verify:

- [ ] Database tables created (check Supabase → Table Editor)
- [ ] 4 roles exist in `roles` table
- [ ] 15 features exist in `features` table
- [ ] Role permissions populated in `role_permissions` table
- [ ] Redirect URLs configured in Supabase
- [ ] Can create new user account (signup works)
- [ ] User appears in Supabase → Authentication → Users
- [ ] Profile created in `profiles` table
- [ ] Organization created in `organizations` table
- [ ] Can login with created account
- [ ] Dashboard loads with sidebar navigation
- [ ] Can see available pages based on role

---

## 🎯 What's Working Now

### ✅ Authentication
- Email/password signup
- Email/password login
- Separate platform admin login
- Session management
- Automatic logout on session expiry

### ✅ Multi-Tenancy
- Organization creation on signup
- User-organization isolation
- Row Level Security

### ✅ Role-Based Access Control
- 4 pre-defined roles
- 15 permission features
- Role-based default permissions
- User-specific permission overrides

### ✅ Dashboard & UI
- Responsive sidebar layout
- Protected routes
- Permission-based navigation
- Beautiful auth pages
- Empty page shells for all features

### ✅ User Management (Super Admin)
- View all org users
- Create new users
- Assign roles
- See user details

### ✅ Audit Trail
- Logs user creation
- Logs permission changes
- Filterable by date
- Organization-scoped

---

## 🔧 Troubleshooting

### Issue: "Failed to create organization"
**Solution:** Make sure you ran the database migration (Step 1)

### Issue: "Not authorized as platform admin"
**Solution:** Run the UPDATE query from Step 3 to make user a platform admin

### Issue: "Unauthorized" on API calls
**Solution:** Check if:
- User is logged in
- Session hasn't expired
- Supabase anon key is correct in .env

### Issue: Can't create users
**Solution:** 
- Make sure you're logged in as Client Super Admin or Platform Admin
- Check service_role key is set in .env

### Issue: Pages not showing in sidebar
**Solution:** User doesn't have permission. Either:
- Login as Client Super Admin (has all permissions)
- Login as Platform Admin (bypasses all checks)

---

## 📊 Default Permissions by Role

### Client Super Admin (Full Access)
✅ All permissions:
- project.create, project.edit, project.view
- campaign.create, campaign.edit, campaign.run, campaign.view
- leads.upload, leads.edit, leads.view
- analytics.view_basic
- billing.view
- users.create, users.edit
- audit.view

### Manager
✅ Limited management:
- project.create, project.edit, project.view
- campaign.create, campaign.edit, campaign.run, campaign.view
- leads.upload, leads.edit, leads.view
- analytics.view_basic

### Employee
✅ View only:
- project.view
- campaign.view
- leads.view

### Platform Admin
✅ Bypasses all permission checks
✅ Can access all organizations
✅ Full system access

---

## 🚀 Next Steps After Setup

1. ✅ **Test signup flow** - Create a test organization
2. ✅ **Test login flow** - Login with created user
3. ✅ **Create additional users** - Test user management
4. ✅ **Check audit logs** - Verify logging is working
5. ✅ **Test permissions** - Create Manager and Employee users
6. ⏭️ **Implement features** - Add project, campaign, lead management

---

## 📞 Need Help?

### Check Application Logs
```bash
tail -f /var/log/supervisor/nextjs.out.log
```

### Check Database
Go to Supabase → Table Editor to inspect:
- `profiles` - User profiles
- `organizations` - Organizations
- `audit_logs` - Activity logs
- `roles` - Role definitions
- `features` - Permission features

### Common SQL Queries

**Check if roles exist:**
```sql
SELECT * FROM roles;
```

**Check if features exist:**
```sql
SELECT * FROM features;
```

**Check user permissions:**
```sql
SELECT p.email, r.name as role, f.name as permission
FROM profiles p
JOIN role_permissions rp ON rp.role_id = p.role_id
JOIN features f ON f.id = rp.feature_id
JOIN roles r ON r.id = p.role_id
WHERE p.email = 'test@example.com';
```

**Check audit logs:**
```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

---

## ✨ You're All Set!

Once you complete Steps 1-3, your multi-tenant SaaS platform is ready to use!

**Test URL:** https://6e5ca5f8-8fae-4bf5-8e5f-8b2b651de5d6.e1.dev.codezero.emergent.app

Happy building! 🎉
