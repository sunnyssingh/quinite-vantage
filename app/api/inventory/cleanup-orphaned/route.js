import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import { corsJSON } from '@/lib/cors'

/**
 * DELETE endpoint to clean up orphaned properties
 * (properties whose project_id doesn't exist in projects table)
 */
export async function DELETE(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()

        // Get user's organization
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        // Only allow admins to run cleanup
        if (!['super_admin', 'platform_admin', 'admin'].includes(profile.role)) {
            return corsJSON({ error: 'Forbidden - Admin access required' }, { status: 403 })
        }

        // Get all properties for this organization
        const { data: properties, error: propsError } = await adminClient
            .from('properties')
            .select('id, project_id')
            .eq('organization_id', profile.organization_id)

        if (propsError) throw propsError

        // Get all valid project IDs
        const { data: projects, error: projectsError } = await adminClient
            .from('projects')
            .select('id')
            .eq('organization_id', profile.organization_id)

        if (projectsError) throw projectsError

        const validProjectIds = new Set(projects.map(p => p.id))

        // Find orphaned properties
        const orphanedProperties = properties.filter(prop => !validProjectIds.has(prop.project_id))
        const orphanedIds = orphanedProperties.map(p => p.id)

        if (orphanedIds.length === 0) {
            return corsJSON({
                message: 'No orphaned properties found',
                deleted: 0
            })
        }

        // Delete orphaned properties
        const { error: deleteError } = await adminClient
            .from('properties')
            .delete()
            .in('id', orphanedIds)
            .eq('organization_id', profile.organization_id)

        if (deleteError) throw deleteError

        return corsJSON({
            message: `Successfully deleted ${orphanedIds.length} orphaned properties`,
            deleted: orphanedIds.length,
            orphanedProjectIds: [...new Set(orphanedProperties.map(p => p.project_id))]
        })
    } catch (e) {
        console.error('cleanup-orphaned DELETE error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
