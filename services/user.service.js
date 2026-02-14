import { createAdminClient } from '@/lib/supabase/admin'
import { getUserProfile, getUserProfiles } from '@/lib/utils/user'

/**
 * User Service
 * Centralized business logic for user/profile operations
 */
export class UserService {
    /**
     * Get users for organization
     */
    static async getUsers(organizationId, filters = {}) {
        const adminClient = createAdminClient()

        let query = adminClient
            .from('profiles')
            .select(`
                *
            `)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })

        if (filters.role) {
            query = query.eq('role', filters.role)
        }

        if (filters.active !== undefined) {
            query = query.eq('active', filters.active)
        }

        const { data: users, error } = await query

        if (error) throw error

        return users || []
    }

    /**
     * Get single user by ID
     */
    static async getUserById(userId, organizationId) {
        const profile = await getUserProfile(userId)

        if (!profile || profile.organization_id !== organizationId) {
            return null
        }

        return profile
    }

    /**
     * Create a new user (invite)
     */
    static async createUser(userData, organizationId, createdBy) {
        const adminClient = createAdminClient()

        const insertData = {
            ...userData,
            organization_id: organizationId,
            created_by: createdBy,
            active: true,
            created_at: new Date().toISOString()
        }

        const { data: user, error } = await adminClient
            .from('profiles')
            .insert(insertData)
            .select()
            .single()

        if (error) throw error

        return user
    }

    /**
     * Update a user
     */
    static async updateUser(userId, updates, organizationId) {
        const adminClient = createAdminClient()

        const { data: user, error } = await adminClient
            .from('profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .eq('organization_id', organizationId)
            .select()
            .single()

        if (error) throw error

        // Clear cache for this user
        const { clearProfileCache } = await import('@/lib/utils/user')
        clearProfileCache(userId)

        return user
    }

    /**
     * Toggle user active status
     */
    static async toggleUserStatus(userId, organizationId) {
        const adminClient = createAdminClient()

        // Get current status
        const { data: currentUser } = await adminClient
            .from('profiles')
            .select('active')
            .eq('id', userId)
            .eq('organization_id', organizationId)
            .single()

        if (!currentUser) throw new Error('User not found')

        // Toggle status
        const { data: user, error } = await adminClient
            .from('profiles')
            .update({
                active: !currentUser.active,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .eq('organization_id', organizationId)
            .select()
            .single()

        if (error) throw error

        // Clear cache
        const { clearProfileCache } = await import('@/lib/utils/user')
        clearProfileCache(userId)

        return user
    }

    /**
     * Delete a user
     */
    static async deleteUser(userId, organizationId) {
        const adminClient = createAdminClient()

        const { error } = await adminClient
            .from('profiles')
            .delete()
            .eq('id', userId)
            .eq('organization_id', organizationId)

        if (error) throw error

        // Clear cache
        const { clearProfileCache } = await import('@/lib/utils/user')
        clearProfileCache(userId)

        return true
    }

    /**
     * Get user statistics for organization
     */
    static async getUserStats(organizationId) {
        const adminClient = createAdminClient()

        const { data: users, error } = await adminClient
            .from('profiles')
            .select('role, active')
            .eq('organization_id', organizationId)

        if (error) throw error

        const stats = {
            total: users?.length || 0,
            active: users?.filter(u => u.active).length || 0,
            inactive: users?.filter(u => !u.active).length || 0,
            byRole: {}
        }

        // Count by role
        users?.forEach(user => {
            const role = user.role || 'unknown'
            stats.byRole[role] = (stats.byRole[role] || 0) + 1
        })

        return stats
    }
}
