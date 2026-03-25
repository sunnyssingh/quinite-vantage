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
    /**
     * Sync project inventory based on unit types
     * Creates properties for each unit configuration
     */
    static async syncProjectInventory(project, createdBy) {
        const adminClient = createAdminClient()
        const unitTypes = project.unit_types || []
        const organizationId = project.organization_id
        const projectId = project.id

        // 1. Get existing properties for this project to avoid duplicates
        const { data: existingProperties, error: fetchError } = await adminClient
            .from('properties')
            .select('title, configuration, unit_number')
            .eq('project_id', projectId)

        if (fetchError) throw fetchError

        const existingMap = new Set(existingProperties?.map(p => p.title) || [])
        const inserts = []

        // 2. Prepare inserts for each unit type
        for (const type of unitTypes) {
            const count = parseInt(type.count) || 0
            const config = type.configuration || type.property_type
            
            for (let i = 1; i <= count; i++) {
                const title = `${project.name} - ${config} - Unit ${i}`
                
                // Only insert if not already exists
                if (!existingMap.has(title)) {
                    inserts.push({
                        organization_id: organizationId,
                        project_id: projectId,
                        title,
                        description: `Automatically created unit for ${project.name}`,
                        address: project.address,
                        price: parseFloat(type.price) || 0,
                        type: type.property_type || 'Apartment',
                        configuration: config,
                        size_sqft: parseFloat(type.carpet_area) || 0,
                        status: 'available',
                        created_by: createdBy,
                        unit_number: `${i}`,
                        show_in_crm: true,
                        metadata: {
                            auto_created: true,
                            sync_date: new Date().toISOString()
                        }
                    })
                }
            }
        }

        // 3. Batch insert
        if (inserts.length > 0) {
            const { error: insertError } = await adminClient
                .from('properties')
                .insert(inserts)
            
            if (insertError) throw insertError
        }

        return inserts.length
    }
}
