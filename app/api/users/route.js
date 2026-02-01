import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'

// Platform Admin role ID - CANNOT be assigned via user creation
const PLATFORM_ADMIN_ROLE_ID = 'ae4aeaf0-9b6e-435e-949d-8834a587a13e'

/**
 * GET /api/users
 * Returns all users in the current user's organization
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Users API - Auth error:', authError)
      return corsJSON({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    console.log('Users API - Profile:', profile, 'Error:', profileError)

    if (!profile?.organization_id) {
      console.warn('Users API - No organization found for user:', user.id)
      // Return empty array instead of error for better UX
      return corsJSON({ users: [] })
    }

    // Use admin client to bypass RLS and get all users
    const adminClient = createAdminClient()

    // Get all users in the organization
    const { data: users, error } = await adminClient
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        organization_id,
        role,
        created_at
      `)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Users API - Query error:', error)
      throw error
    }

    // Return users with role already included
    return corsJSON({ users: users || [] })
  } catch (e) {
    console.error('users GET error:', e)
    return corsJSON({ error: e.message }, { status: 500 })
  }
}

/**
 * POST /api/users
 * Create a new user in the organization
 */
export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return corsJSON({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, full_name, is_platform_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id && !profile?.is_platform_admin) {
      return corsJSON({ error: 'Organization not found' }, { status: 400 })
    }

    const { email, password, fullName, phone, roleId } = body

    // Validate input
    if (!email || !password) {
      return corsJSON({ error: 'Email and password are required' }, { status: 400 })
    }

    if (!roleId) {
      return corsJSON({ error: 'Role is required' }, { status: 400 })
    }

    // 🔴 CRITICAL: Block Platform Admin role assignment
    if (roleId === PLATFORM_ADMIN_ROLE_ID) {
      return corsJSON({
        error: 'Platform Admin role cannot be assigned via user creation'
      }, { status: 403 })
    }

    // Verify role exists and is valid
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('id', roleId)
      .single()

    if (roleError || !role) {
      return corsJSON({ error: 'Invalid role selected' }, { status: 400 })
    }

    // Additional check: ensure it's not Platform Admin by name
    if (role.name === 'Platform Admin') {
      return corsJSON({
        error: 'Platform Admin role cannot be assigned via user creation'
      }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Create user in Supabase Auth
    const { data: authData, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for internal users
      user_metadata: {
        full_name: fullName || email.split('@')[0]
      }
    })

    if (createUserError) {
      console.error('User creation error:', createUserError)
      return corsJSON({
        error: createUserError.message || 'Failed to create user'
      }, { status: 400 })
    }

    // Create or update profile (use upsert in case profile was auto-created by trigger)
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name: fullName || email.split('@')[0],
        phone: phone || null,
        organization_id: profile.organization_id,
        role_id: roleId,
        is_platform_admin: false // Always false for user-created accounts
      }, {
        onConflict: 'id' // Update if profile already exists
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Rollback: delete auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return corsJSON({ error: 'Failed to create user profile' }, { status: 500 })
    }

    // Create audit log
    try {
      await logAudit(
        supabase,
        user.id,
        profile.full_name || user.email,
        'USER_CREATED',
        'user',
        authData.user.id,
        {
          email,
          role_name: role.name,
          created_by: user.email
        }
      )
    } catch (e) {
      console.warn('Audit log failed:', e.message)
    }

    return corsJSON({
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email,
        full_name: fullName || email.split('@')[0],
        role: role.name
      }
    })
  } catch (e) {
    console.error('users POST error:', e)
    return corsJSON({ error: e.message || 'Failed to create user' }, { status: 500 })
  }
}
