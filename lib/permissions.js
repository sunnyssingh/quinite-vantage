import { createAdminClient } from '@/lib/supabase/admin'
import { ROLE_PERMISSIONS } from '@/lib/roles'

/**
 * =====================================================
 * RBAC + AUDIT UTILITIES (FINAL / PRODUCTION)
 * =====================================================
 * Simplified to use Static Role Definitions (lib/roles.js)
 */

/* =====================================================
   CHECK SINGLE PERMISSION (Hybrid DB/RPC approach)
===================================================== */
export async function hasPermission(supabase, userId, featureName) {
  try {
    if (!userId || !featureName) return false

    // 1. Try RPC if it's the current user (Fastest)
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id === userId) {
      const { data, error } = await supabase.rpc('auth_has_permission', { perm: featureName })
      if (!error && data !== null) return data
    }

    // 2. Fallback: Admin fetch from DB (Reliable)
    const admin = createAdminClient()

    // Get user's role_id
    const { data: profile } = await admin
      .from('profiles')
      .select('role_id')
      .eq('id', userId)
      .maybeSingle()

    if (!profile?.role_id) return false

    // Get permissions for that role
    const { data: role } = await admin
      .from('roles')
      .select('permissions')
      .eq('id', profile.role_id)
      .single()

    const perms = role?.permissions || []
    return perms.includes(featureName)
  } catch (error) {
    console.error('hasPermission error:', error)
    return false
  }
}

/* =====================================================
   GET ALL EFFECTIVE PERMISSIONS
===================================================== */
export async function getUserPermissions(supabase, userId) {
  try {
    const admin = createAdminClient()

    // Get user's role_id
    const { data: profile } = await admin
      .from('profiles')
      .select('role_id')
      .eq('id', userId)
      .maybeSingle()

    if (!profile?.role_id) return []

    // Get permissions
    const { data: role } = await admin
      .from('roles')
      .select('permissions')
      .eq('id', profile.role_id)
      .single()

    return role?.permissions || []
  } catch (error) {
    console.error('getUserPermissions error:', error)
    return []
  }
}

/* =====================================================
   AUDIT LOGGING (ORG-SAFE)
===================================================== */
export async function logAudit(
  supabase, // Kept for signature compatibility but ignored for operations
  userId,
  userName,
  action,
  entityType,
  entityId,
  metadata = {},
  impersonation = null
) {
  try {
    if (!userId || !action) return

    // Use admin client for reliable logging
    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .maybeSingle()

    await admin.from('audit_logs').insert({
      organization_id: profile?.organization_id ?? null,
      user_id: userId,
      user_name: userName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      impersonator_user_id: impersonation?.user_id || null,
      is_impersonated: Boolean(impersonation?.user_id),
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('logAudit error:', error)
  }
}
