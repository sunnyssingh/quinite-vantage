/**
 * Usage Limits Middleware
 * Enforces limits based on subscription plan
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Check if organization has reached user limit
 * @param {string} organizationId - Organization UUID
 * @returns {Promise<{canAdd: boolean, currentCount: number, maxUsers: number|null, reason: string|null}>}
 */
export async function checkUserLimit(organizationId) {
    const supabase = await createServerSupabaseClient()

    try {
        // Get subscription with plan details
        const { data: subscription, error } = await supabase
            .from('organization_subscriptions')
            .select(`
        *,
        plan:billing_plans(max_users)
      `)
            .eq('organization_id', organizationId)
            .single()

        if (error || !subscription) {
            return {
                canAdd: false,
                currentCount: 0,
                maxUsers: null,
                reason: 'No active subscription found'
            }
        }

        const currentCount = subscription.user_count || 0
        const maxUsers = subscription.plan?.max_users

        // If max_users is null, unlimited users allowed
        if (maxUsers === null) {
            return {
                canAdd: true,
                currentCount,
                maxUsers: null,
                reason: null
            }
        }

        // Check if limit reached
        if (currentCount >= maxUsers) {
            return {
                canAdd: false,
                currentCount,
                maxUsers,
                reason: `User limit reached (${currentCount}/${maxUsers}). Upgrade your plan to add more users.`
            }
        }

        return {
            canAdd: true,
            currentCount,
            maxUsers,
            reason: null
        }
    } catch (error) {
        console.error('Error checking user limit:', error)
        return {
            canAdd: false,
            currentCount: 0,
            maxUsers: null,
            reason: 'Error checking user limit'
        }
    }
}

/**
 * Check storage usage limit
 * @param {string} organizationId - Organization UUID
 * @param {number} additionalMB - Additional storage needed in MB
 * @returns {Promise<{canUse: boolean, currentUsage: number, limit: number, reason: string|null}>}
 */
export async function checkStorageLimit(organizationId, additionalMB = 0) {
    const supabase = await createServerSupabaseClient()

    try {
        // Get subscription with plan details
        const { data: subscription, error } = await supabase
            .from('organization_subscriptions')
            .select(`
        *,
        plan:billing_plans(features)
      `)
            .eq('organization_id', organizationId)
            .single()

        if (error || !subscription) {
            return {
                canUse: false,
                currentUsage: 0,
                limit: 0,
                reason: 'No active subscription found'
            }
        }

        // Get storage limit from plan features (in GB)
        const storageLimit = subscription.plan?.features?.storage_limit_gb || 5 // Default 5GB
        const limitMB = storageLimit * 1024

        // Calculate current storage usage
        const { data: files } = await supabase
            .from('lead_documents')
            .select('file_size')
            .eq('organization_id', organizationId)

        const currentUsageMB = files
            ? files.reduce((sum, file) => sum + (file.file_size || 0), 0) / (1024 * 1024)
            : 0

        const totalUsage = currentUsageMB + additionalMB

        if (totalUsage > limitMB) {
            return {
                canUse: false,
                currentUsage: currentUsageMB,
                limit: limitMB,
                reason: `Storage limit exceeded (${totalUsage.toFixed(2)}MB / ${limitMB}MB). Upgrade your plan for more storage.`
            }
        }

        return {
            canUse: true,
            currentUsage: currentUsageMB,
            limit: limitMB,
            reason: null
        }
    } catch (error) {
        console.error('Error checking storage limit:', error)
        return {
            canUse: false,
            currentUsage: 0,
            limit: 0,
            reason: 'Error checking storage limit'
        }
    }
}

/**
 * Check API rate limit
 * @param {string} organizationId - Organization UUID
 * @returns {Promise<{canProceed: boolean, remaining: number, limit: number, resetAt: Date|null}>}
 */
export async function checkRateLimit(organizationId) {
    const supabase = await createServerSupabaseClient()

    try {
        // Get subscription with plan details
        const { data: subscription, error } = await supabase
            .from('organization_subscriptions')
            .select(`
        *,
        plan:billing_plans(features)
      `)
            .eq('organization_id', organizationId)
            .single()

        if (error || !subscription) {
            return {
                canProceed: false,
                remaining: 0,
                limit: 0,
                resetAt: null
            }
        }

        // Get rate limit from plan features (requests per hour)
        const rateLimit = subscription.plan?.features?.api_rate_limit || 1000

        // Check usage in the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

        const { count } = await supabase
            .from('usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .gte('created_at', oneHourAgo.toISOString())

        const remaining = Math.max(0, rateLimit - (count || 0))

        if (remaining === 0) {
            const resetAt = new Date(Math.ceil(Date.now() / (60 * 60 * 1000)) * (60 * 60 * 1000))
            return {
                canProceed: false,
                remaining: 0,
                limit: rateLimit,
                resetAt
            }
        }

        return {
            canProceed: true,
            remaining,
            limit: rateLimit,
            resetAt: null
        }
    } catch (error) {
        console.error('Error checking rate limit:', error)
        return {
            canProceed: true, // Fail open
            remaining: 0,
            limit: 0,
            resetAt: null
        }
    }
}

/**
 * Increment user count for organization
 * @param {string} organizationId - Organization UUID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function incrementUserCount(organizationId) {
    const supabase = await createServerSupabaseClient()

    try {
        const { error } = await supabase
            .from('organization_subscriptions')
            .update({
                user_count: supabase.raw('user_count + 1')
            })
            .eq('organization_id', organizationId)

        return {
            success: !error,
            error: error ? 'Failed to update user count' : null
        }
    } catch (error) {
        console.error('Error incrementing user count:', error)
        return {
            success: false,
            error: 'Error updating user count'
        }
    }
}

/**
 * Decrement user count for organization
 * @param {string} organizationId - Organization UUID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function decrementUserCount(organizationId) {
    const supabase = await createServerSupabaseClient()

    try {
        const { error } = await supabase
            .from('organization_subscriptions')
            .update({
                user_count: supabase.raw('GREATEST(user_count - 1, 0)')
            })
            .eq('organization_id', organizationId)

        return {
            success: !error,
            error: error ? 'Failed to update user count' : null
        }
    } catch (error) {
        console.error('Error decrementing user count:', error)
        return {
            success: false,
            error: 'Error updating user count'
        }
    }
}
