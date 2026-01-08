import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client with SERVICE ROLE key
 * 
 * WARNING: This bypasses Row Level Security (RLS) and should ONLY be used:
 * - In server-side API routes (never expose to client)
 * - For administrative operations that require elevated privileges
 * - When you need to create/modify data across organizations
 * 
 * Use cases:
 * - Creating organizations during user onboarding
 * - Updating user profiles with admin privileges
 * - Cross-organization admin operations
 * - Audit logging that requires system-level access
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase credentials for admin client')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
