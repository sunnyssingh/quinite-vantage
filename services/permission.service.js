import { hasDashboardPermission, getUserDashboardPermissions } from '@/lib/dashboardPermissions'

export const PermissionService = {
    /**
     * Check if a user has a specific permission
     * @param {string} userId
     * @param {string} permission
     * @returns {Promise<boolean>}
     */
    async hasPermission(userId, permission) {
        return await hasDashboardPermission(userId, permission)
    },

    /**
     * Get all permissions for a user
     * @param {string} userId
     * @returns {Promise<string[]>}
     */
    async getUserPermissions(userId) {
        return await getUserDashboardPermissions(userId)
    }
}
