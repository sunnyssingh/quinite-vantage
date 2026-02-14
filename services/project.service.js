import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Project Service
 * Centralized business logic for project operations
 */
export class ProjectService {
    /**
     * Get projects for organization
     */
    static async getProjects(organizationId, filters = {}) {
        const adminClient = createAdminClient()

        let query = adminClient
            .from('projects')
            .select(`
                *,
                leads:leads(count),
                campaigns:campaigns(count)
            `, { count: 'exact' })
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })

        if (filters.status) {
            query = query.eq('status', filters.status)
        }

        if (filters.projectType) {
            query = query.eq('project_type', filters.projectType)
        }

        // Pagination
        const page = filters.page ? parseInt(filters.page) : 1
        const limit = filters.limit ? parseInt(filters.limit) : 20
        const from = (page - 1) * limit
        const to = from + limit - 1

        query = query.range(from, to)

        const { data: projects, error, count } = await query

        if (error) throw error

        return {
            projects: projects || [],
            metadata: {
                total: count || 0,
                page,
                limit,
                hasMore: (from + limit) < (count || 0)
            }
        }
    }

    /**
     * Get single project by ID
     */
    static async getProjectById(projectId, organizationId) {
        const adminClient = createAdminClient()

        const { data: project, error } = await adminClient
            .from('projects')
            .select(`
                *,
                leads:leads(count),
                campaigns:campaigns(count),
                properties:properties(count)
            `)
            .eq('id', projectId)
            .eq('organization_id', organizationId)
            .single()

        if (error) throw error

        return project
    }

    /**
     * Create a new project
     */
    static async createProject(projectData, organizationId, createdBy) {
        const adminClient = createAdminClient()

        const insertData = {
            ...projectData,
            organization_id: organizationId,
            created_by: createdBy,
            status: 'active',
            created_at: new Date().toISOString()
        }

        const { data: project, error } = await adminClient
            .from('projects')
            .insert(insertData)
            .select()
            .single()

        if (error) throw error

        return project
    }

    /**
     * Update a project
     */
    static async updateProject(projectId, updates, organizationId) {
        const adminClient = createAdminClient()

        const { data: project, error } = await adminClient
            .from('projects')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', projectId)
            .eq('organization_id', organizationId)
            .select()
            .single()

        if (error) throw error

        return project
    }

    /**
     * Delete a project
     */
    static async deleteProject(projectId, organizationId) {
        const adminClient = createAdminClient()

        const { error } = await adminClient
            .from('projects')
            .delete()
            .eq('id', projectId)
            .eq('organization_id', organizationId)

        if (error) throw error

        return true
    }

    /**
     * Get project statistics
     */
    static async getProjectStats(projectId, organizationId) {
        const adminClient = createAdminClient()

        // Get leads count
        const { count: leadsCount } = await adminClient
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)

        // Get campaigns count
        const { count: campaignsCount } = await adminClient
            .from('campaigns')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)

        // Get properties count
        const { count: propertiesCount } = await adminClient
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)

        return {
            leadsCount: leadsCount || 0,
            campaignsCount: campaignsCount || 0,
            propertiesCount: propertiesCount || 0
        }
    }
}
