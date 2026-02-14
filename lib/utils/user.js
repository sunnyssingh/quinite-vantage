import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Cache for user profiles (in-memory, request-scoped)
 * In production, consider using Redis
 */
const profileCache = new Map()

/**
 * Get user profile by user ID
 * Caches result to avoid repeated database queries
 * 
 * @param {string} userId - The user's ID
 * @param {boolean} forceRefresh - Force cache refresh
 * @returns {Promise<Object|null>} User profile or null
 */
export async function getUserProfile(userId, forceRefresh = false) {
    if (!userId) return null

    // Check cache first
    if (!forceRefresh && profileCache.has(userId)) {
        return profileCache.get(userId)
    }

    try {
        const adminClient = createAdminClient()
        const { data: profile, error } = await adminClient
            .from('profiles')
            .select('id, organization_id, role, full_name, email, phone, avatar_url')
            .eq('id', userId)
            .maybeSingle()

        if (error) {
            console.error('getUserProfile error:', error)
            return null
        }

        // Cache the result
        if (profile) {
            profileCache.set(userId, profile)

            // Auto-expire cache after 5 minutes
            setTimeout(() => profileCache.delete(userId), 5 * 60 * 1000)
        }

        return profile
    } catch (error) {
        console.error('getUserProfile error:', error)
        return null
    }
}

/**
 * Clear profile cache for a specific user
 * Call this after profile updates
 */
export function clearProfileCache(userId) {
    if (userId) {
        profileCache.delete(userId)
    } else {
        profileCache.clear()
    }
}

/**
 * Get multiple user profiles by IDs
 * More efficient than calling getUserProfile multiple times
 */
export async function getUserProfiles(userIds) {
    if (!userIds || userIds.length === 0) return []

    try {
        const adminClient = createAdminClient()
        const { data: profiles, error } = await adminClient
            .from('profiles')
            .select('id, organization_id, role, full_name, email, phone, avatar_url')
            .in('id', userIds)

        if (error) {
            console.error('getUserProfiles error:', error)
            return []
        }

        // Cache all results
        profiles?.forEach(profile => {
            profileCache.set(profile.id, profile)
        })

        return profiles || []
    } catch (error) {
        console.error('getUserProfiles error:', error)
        return []
    }
}

/**
 * Check if user is platform admin
 */
export async function isPlatformAdmin(userId) {
    const profile = await getUserProfile(userId)
    return profile?.role === 'platform_admin'
}

/**
 * Check if user belongs to organization
 */
export async function userBelongsToOrg(userId, organizationId) {
    const profile = await getUserProfile(userId)
    return profile?.organization_id === organizationId
}
