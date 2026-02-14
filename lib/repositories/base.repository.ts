import { createAdminClient } from '@/lib/supabase/admin'
import { SupabaseClient } from '@supabase/supabase-js'

export class BaseRepository<T = any> {
    protected tableName: string
    public client: SupabaseClient

    constructor(tableName: string) {
        this.tableName = tableName
        this.client = createAdminClient()
    }

    async findById(id: string): Promise<T | null> {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    }

    async findAll(filters: Record<string, any> = {}): Promise<T[]> {
        const query = this.client.from(this.tableName).select('*')
        // Basic filter implementation could go here
        const { data, error } = await query
        if (error) throw error
        return data || []
    }

    async create(data: Partial<T>): Promise<T> {
        const { data: created, error } = await this.client
            .from(this.tableName)
            .insert(data)
            .select()
            .single()

        if (error) throw error
        return created
    }

    async update(id: string, data: Partial<T>): Promise<T> {
        const { data: updated, error } = await this.client
            .from(this.tableName)
            .update(data)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return updated
    }

    async delete(id: string): Promise<boolean> {
        const { error } = await this.client
            .from(this.tableName)
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    }

    // Helper for scope/org checks
    scoped(organizationId: string) {
        return this.client.from(this.tableName).eq('organization_id', organizationId)
    }
}
