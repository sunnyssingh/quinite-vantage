/**
 * =====================================================
 * RBAC + AUDIT UTILITIES (FINAL / PRODUCTION)
 * =====================================================
 * Priority:
 * 1. Platform Admin
 * 2. User override (allow / deny)
 * 3. Role permission
 */

/* =====================================================
   CHECK SINGLE PERMISSION
===================================================== */
export async function hasPermission(supabase, userId, featureName) {
  try {
    if (!userId || !featureName) return false

    /* 1️⃣ Load profile */
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, is_platform_admin')
      .eq('id', userId)
      .maybeSingle()

    if (!profile) return false

    /* Platform admin = everything */
    if (profile.is_platform_admin) return true

    /* 2️⃣ Resolve feature by NAME */
    const { data: feature } = await supabase
      .from('features')
      .select('id')
      .eq('name', featureName)
      .maybeSingle()

    if (!feature) return false

    /* 3️⃣ User-level override (highest priority) */
    const { data: userPerm } = await supabase
      .from('user_permissions')
      .select('granted')
      .eq('user_id', userId)
      .eq('feature_id', feature.id)
      .maybeSingle()

    if (userPerm !== null) {
      return userPerm.granted === true
    }

    /* 4️⃣ Role-based permission */
    if (!profile.role_id) return false

    const { data: rolePerm } = await supabase
      .from('role_permissions')
      .select('id')
      .eq('role_id', profile.role_id)
      .eq('feature_id', feature.id)
      .maybeSingle()

    return Boolean(rolePerm)
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, is_platform_admin')
      .eq('id', userId)
      .maybeSingle()

    if (!profile) return []

    /* Platform admin = all permissions */
    if (profile.is_platform_admin) {
      const { data: features } = await supabase
        .from('features')
        .select('name')

      return features?.map(f => f.name) || []
    }

    const permissions = new Set()

    /* Role permissions */
    if (profile.role_id) {
      const { data: rolePerms } = await supabase
        .from('role_permissions')
        .select('features(name)')
        .eq('role_id', profile.role_id)

      rolePerms?.forEach(rp => {
        if (rp.features?.name) {
          permissions.add(rp.features.name)
        }
      })
    }

    /* User overrides */
    const { data: userPerms } = await supabase
      .from('user_permissions')
      .select('granted, features(name)')
      .eq('user_id', userId)

    userPerms?.forEach(up => {
      const name = up.features?.name
      if (!name) return

      if (up.granted) {
        permissions.add(name)
      } else {
        permissions.delete(name)
      }
    })

    return Array.from(permissions)
  } catch (error) {
    console.error('getUserPermissions error:', error)
    return []
  }
}

/* =====================================================
   AUDIT LOGGING (ORG-SAFE)
===================================================== */
export async function logAudit(
  supabase,
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .maybeSingle()

    await supabase.from('audit_logs').insert({
      organization_id: profile?.organization_id ?? null,
      user_id: userId,
      user_name: userName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      impersonator_user_id: impersonation?.user_id || null,
      is_impersonated: Boolean(impersonation),
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('logAudit error:', error)
  }
}
