// ==============================================================================
// Role-based middleware for API routes
// ==============================================================================

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * Require authentication and specific role(s)
 * @param {Request} request - Next.js request object
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Promise<{user, profile} | NextResponse>} - User and profile or error response
 */
export async function requireRole(request, allowedRoles = []) {
    try {
        // Check authentication
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get user profile with role
        const admin = createAdminClient()
        const { data: profile, error: profileError } = await admin
            .from('profiles')
            .select('id, role, organization_id, full_name, email')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return NextResponse.json(
                { error: 'User profile not found' },
                { status: 404 }
            )
        }

        // Check role authorization
        if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
            return NextResponse.json(
                {
                    error: 'Forbidden',
                    message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
                },
                { status: 403 }
            )
        }

        // Return user and profile for use in route handler
        return { user, profile }

    } catch (error) {
        console.error('[requireRole] Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * Check if user has specific role
 * @param {string} userRole - User's role
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {boolean}
 */
export function hasRole(userRole, allowedRoles = []) {
    return allowedRoles.includes(userRole)
}

/**
 * Check if user is super admin
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export function isSuperAdmin(userRole) {
    return userRole === 'super_admin'
}

/**
 * Check if user is manager or above
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export function isManagerOrAbove(userRole) {
    return ['super_admin', 'manager'].includes(userRole)
}

/**
 * Check if user is platform admin
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export function isPlatformAdmin(userRole) {
    return userRole === 'platform_admin'
}
