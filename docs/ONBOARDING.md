# Onboarding Flow Documentation

## Overview

The signup onboarding process is separated into three distinct steps to properly handle authentication, session management, and organization setup with appropriate permissions.

## Architecture

### Why Service Role?

The onboarding flow uses **Supabase Service Role** key for organization creation and profile updates. This is necessary because:

1. **Row Level Security (RLS)**: Regular authenticated users cannot create organizations due to RLS policies
2. **Profile Updates**: New users don't have permission to update their own profile's `organization_id` and `role_id`
3. **Admin Operations**: Creating organizations and assigning roles are administrative tasks that require elevated privileges

### Security Considerations

- **Service Role is NEVER exposed to client**: Only used in server-side API routes
- **User must be authenticated**: Onboarding endpoint verifies user session before proceeding
- **Idempotent**: If user already has an organization, returns success without creating duplicates
- **Single organization per user**: Users can only create one organization during onboarding

## Flow Diagram

```
User Signup Request
        ↓
┌──────────────────────────────────────────────┐
│ Step 1: POST /api/auth/signup                │
│ - Creates auth.users entry                   │
│ - Profile auto-created via trigger           │
│ - Returns user object                        │
└──────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────┐
│ Step 2: POST /api/auth/signin                │
│ - Authenticates user                         │
│ - Creates session                            │
│ - Returns session token                      │
└──────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────┐
│ Step 3: POST /api/onboard                    │
│ ┌──────────────────────────────────────────┐ │
│ │ Using SERVICE ROLE:                      │ │
│ │ 1. Create organization                   │ │
│ │ 2. Fetch "Client Super Admin" role       │ │
│ │ 3. Update profile:                       │ │
│ │    - organization_id                     │ │
│ │    - role_id                             │ │
│ │    - full_name                           │ │
│ │ 4. Create audit log entry                │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
        ↓
   Redirect to Dashboard
```

## API Endpoints

### 1. POST /api/auth/signup

**Purpose**: Create authentication account only

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response**:
```json
{
  "message": "Signup successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**What it does**:
- Creates entry in `auth.users`
- Triggers automatic profile creation (via SQL trigger)
- Does NOT create organization
- Does NOT set role

### 2. POST /api/auth/signin

**Purpose**: Authenticate and create session

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "isPlatformAdmin": false
}
```

**Response**:
```json
{
  "message": "Login successful",
  "user": { ... },
  "session": { ... }
}
```

### 3. POST /api/onboard

**Purpose**: Create organization and complete user setup

**Authentication**: Required (session from signin)

**Request Body**:
```json
{
  "fullName": "John Doe",
  "organizationName": "Acme Corp"
}
```

**Response Success**:
```json
{
  "message": "Onboarding successful",
  "organization": {
    "id": "uuid",
    "name": "Acme Corp"
  }
}
```

**Response Already Onboarded**:
```json
{
  "message": "User already onboarded",
  "alreadyOnboarded": true
}
```

**Response Error**:
```json
{
  "error": "Failed to create organization"
}
```

**What it does** (using SERVICE ROLE):
1. Verifies user is authenticated
2. Checks if user already has organization (idempotent)
3. Creates new organization with provided name
4. Fetches "Client Super Admin" role ID
5. Updates user's profile:
   - `organization_id` → new org ID
   - `role_id` → Client Super Admin role
   - `full_name` → provided name
   - `is_platform_admin` → false
6. Creates audit log entry:
   - `action`: "ORG_CREATED"
   - `entity_type`: "organization"
   - `entity_id`: organization ID

## Frontend Implementation

### Signup Handler

```javascript
const handleSignUp = async (e) => {
  e.preventDefault()
  setSubmitting(true)

  try {
    // Step 1: Create auth account
    const signupResponse = await fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    
    if (!signupResponse.ok) throw new Error('Signup failed')

    // Step 2: Sign in to get session
    const signinResponse = await fetch('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    
    if (!signinResponse.ok) throw new Error('Login failed')

    // Step 3: Run onboarding
    const onboardResponse = await fetch('/api/onboard', {
      method: 'POST',
      body: JSON.stringify({ fullName, organizationName })
    })
    
    if (!onboardResponse.ok) {
      // Critical: Show error and DON'T redirect
      setError('Onboarding failed. Please contact support.')
      return
    }

    // Success! Redirect to dashboard
    router.push('/dashboard')
    
  } catch (err) {
    setError(err.message)
  } finally {
    setSubmitting(false)
  }
}
```

## Database Changes

### What the Onboarding Creates

**organizations table**:
```sql
INSERT INTO organizations (id, name, created_at)
VALUES (uuid, 'Acme Corp', NOW())
```

**profiles table** (UPDATE):
```sql
UPDATE profiles
SET 
  organization_id = '<org_uuid>',
  role_id = '<client_super_admin_role_uuid>',
  full_name = 'John Doe',
  is_platform_admin = FALSE
WHERE id = '<user_uuid>'
```

**audit_logs table**:
```sql
INSERT INTO audit_logs (
  user_id,
  user_name,
  action,
  entity_type,
  entity_id,
  metadata,
  created_at
)
VALUES (
  '<user_uuid>',
  'John Doe',
  'ORG_CREATED',
  'organization',
  '<org_uuid>',
  '{"organization_name": "Acme Corp"}',
  NOW()
)
```

## Error Handling

### Scenario 1: Auth Signup Fails
- **When**: Invalid email, weak password, email already exists
- **Handling**: Show error, allow retry
- **Cleanup**: None needed

### Scenario 2: Signin After Signup Fails
- **When**: Rare - password mismatch, account disabled
- **Handling**: Show error, suggest password reset
- **Cleanup**: User exists in auth.users but can't login

### Scenario 3: Onboarding Fails
- **When**: Database error, role not found, service role key invalid
- **Handling**: 
  - Show clear error message
  - DO NOT redirect to dashboard
  - User should contact support
- **Cleanup**: 
  - User exists in auth.users
  - Profile exists but no organization
  - Can retry onboarding

### Scenario 4: User Clicks Signup Twice
- **Handling**: Idempotent check prevents duplicate organizations
- **Response**: Returns "already onboarded" message
- **Result**: Safe to call multiple times

## Service Role Security

### File: /app/lib/supabase/admin.js

```javascript
export function createAdminClient() {
  // Uses SUPABASE_SERVICE_ROLE_KEY from environment
  // This key bypasses RLS policies
  // NEVER expose this client to frontend
  // ONLY use in server-side API routes
}
```

### When to Use Service Role

✅ **Appropriate uses**:
- Creating organizations during onboarding
- Updating user profiles with admin fields
- Cross-organization admin operations (platform admin)
- System-level audit logging
- Creating users as Client Super Admin

❌ **Inappropriate uses**:
- Regular CRUD operations
- User-initiated data queries
- Client-side operations
- Any operation that can use regular auth

## Testing the Flow

### Test Successful Signup

1. Visit signup page
2. Enter:
   - Email: test@example.com
   - Password: test123456
   - Full Name: Test User
   - Organization: Test Corp
3. Click "Create Account"
4. Observe:
   - "Account created successfully!"
   - Redirect to dashboard
5. Verify in Supabase:
   - auth.users has new user
   - profiles has profile with organization_id
   - organizations has "Test Corp"
   - audit_logs has ORG_CREATED entry

### Test Idempotency

1. Login with existing account
2. Call `/api/onboard` again via curl:
```bash
curl -X POST http://localhost:3000/api/onboard \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"organizationName": "Another Org"}'
```
3. Response should be: "User already onboarded"
4. Verify: No duplicate organization created

### Test Error Handling

1. Temporarily remove service role key from .env
2. Try signup
3. Should see: "Onboarding failed. Please contact support."
4. User stuck at signup page (correct behavior)
5. Add back service role key, retry

## Troubleshooting

### Issue: "Failed to create organization"

**Possible causes**:
- Service role key missing or invalid
- Database connection issue
- organizations table doesn't exist

**Solution**:
1. Check `.env` has `SUPABASE_SERVICE_ROLE_KEY`
2. Verify key is correct in Supabase dashboard
3. Run database migration (`schema.sql`)

### Issue: "Failed to fetch role"

**Possible causes**:
- roles table not populated
- "Client Super Admin" role doesn't exist

**Solution**:
Run this SQL in Supabase:
```sql
SELECT * FROM roles WHERE name = 'Client Super Admin';
```
If empty, run the schema migration.

### Issue: User can't login after signup

**Possible causes**:
- Email confirmation required
- Supabase project settings

**Solution**:
1. Go to Supabase → Authentication → Email Auth
2. Disable "Email Confirmations" for testing
3. Or check email for confirmation link

## Migration Notes

### If Upgrading from Old Flow

If you were using the old signup flow that created orgs in the trigger:

1. **Remove organization creation from trigger**:
```sql
DROP FUNCTION IF EXISTS handle_new_user();
```

2. **Users who signed up before**: May have organizations already
3. **Onboarding will skip them**: Idempotent check handles this

### Required Environment Variables

```env
# Required for onboarding
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Required for auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Summary

The new onboarding flow:
✅ Separates auth from organization setup
✅ Uses service role for privileged operations
✅ Is idempotent and safe to retry
✅ Provides clear error messages
✅ Properly handles all edge cases
✅ Maintains security best practices

The three-step process ensures proper session management and permission handling throughout the signup journey.
