import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Property Service
 * Centralized business logic for property operations
 */
export class PropertyService {
    /**
     * Get properties for organization
     */
    static async getProperties(organizationId, filters = {}) {
        const adminClient = createAdminClient()

        let query = adminClient
            .from('properties')
            .select(`
                *,
                project:projects(id, name, address),
                leads:leads(id, name, email, phone)
            `)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })

        if (filters.projectId) {
            query = query.eq('project_id', filters.projectId)
        }

        if (filters.status) {
            query = query.eq('status', filters.status)
        }

        if (filters.propertyType) {
            query = query.eq('property_type', filters.propertyType)
        }

        if (filters.minPrice) {
            query = query.gte('price', filters.minPrice)
        }

        if (filters.maxPrice) {
            query = query.lte('price', filters.maxPrice)
        }

        const { data: properties, error } = await query

        if (error) throw error

        return properties || []
    }

    /**
     * Get single property by ID
     */
    static async getPropertyById(propertyId, organizationId) {
        const adminClient = createAdminClient()

        const { data: property, error } = await adminClient
            .from('properties')
            .select(`
                *,
                project:projects(id, name, address, image_url),
                leads:leads(id, name, email, phone)
            `)
            .eq('id', propertyId)
            .eq('organization_id', organizationId)
            .single()

        if (error) throw error

        return property
    }

    /**
     * Create a new property
     */
    static async createProperty(propertyData, organizationId, createdBy) {
        const adminClient = createAdminClient()

        const insertData = {
            ...propertyData,
            organization_id: organizationId,
            created_by: createdBy,
            status: propertyData.status || 'available',
            created_at: new Date().toISOString()
        }

        const { data: property, error } = await adminClient
            .from('properties')
            .insert(insertData)
            .select()
            .single()

        if (error) throw error

        return property
    }

    /**
     * Update a property
     */
    static async updateProperty(propertyId, updates, organizationId) {
        const adminClient = createAdminClient()

        const { data: property, error } = await adminClient
            .from('properties')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', propertyId)
            .eq('organization_id', organizationId)
            .select()
            .single()

        if (error) throw error

        return property
    }

    /**
     * Delete a property
     */
    static async deleteProperty(propertyId, organizationId) {
        const adminClient = createAdminClient()

        const { error } = await adminClient
            .from('properties')
            .delete()
            .eq('id', propertyId)
            .eq('organization_id', organizationId)

        if (error) throw error

        return true
    }

    /**
     * Get properties by project
     */
    static async getPropertiesByProject(projectId, organizationId) {
        const adminClient = createAdminClient()

        const { data: properties, error } = await adminClient
            .from('properties')
            .select('*')
            .eq('project_id', projectId)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return properties || []
    }
}
