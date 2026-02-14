import { BaseRepository } from '@/lib/repositories/base.repository'

export interface Lead {
    id: string
    organization_id: string
    project_id?: string
    stage_id?: string
    name: string
    email?: string
    phone?: string
    // status removed
    assigned_to?: string
    created_at: string
    // Add other fields as necessary
}

export class LeadRepository extends BaseRepository<Lead> {
    constructor() {
        super('leads')
    }

    async findWithRelations(id: string, organizationId: string): Promise<any> {
        const { data, error } = await this.client
            .from(this.tableName)
            .select(`
        *,
        project:projects(id, name),
        stage:pipeline_stages(id, name, color, pipeline_id),
        deals(id, amount, status),
        property:properties(id, title, price, project:projects(id, name)),
        projects:projects(id, name, image_url, address, project_type),
        call_logs(*),
        assigned_to_user:profiles!leads_assigned_to_fkey(id, full_name, avatar_url)
      `)
            .eq('id', id)
            .eq('organization_id', organizationId)
            .single()

        if (error) throw error
        return data
    }

    findLeadsWithRelations(organizationId: string, filters: any = {}): any {
        let query = this.client
            .from(this.tableName)
            .select(`
        *,
        project:projects(id, name),
        stage:pipeline_stages(id, name, color, pipeline_id),
        deals(id, amount, status),
        assigned_to_user:profiles!leads_assigned_to_fkey(id, full_name, avatar_url)
      `)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })

        // Apply filters
        if (filters.projectId) {
            query = query.eq('project_id', filters.projectId)
        }

        if (filters.stageId && filters.stageId !== 'all') {
            query = query.eq('stage_id', filters.stageId)
        }

        if (filters.search) {
            query = query.or(
                `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
            )
        }

        // Status filter removed as column does not exist

        if (filters.assignedTo) {
            query = query.eq('assigned_to', filters.assignedTo)
        }

        return query
    }
}
