import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'

/**
 * PUT /api/leads/[id]
 * Update an existing lead
 */
export async function PUT(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, full_name')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        // Await params for Next.js 15
        const { id } = await params
        const body = await request.json()
        const { name, email, phone, projectId, status, notes } = body

        // Validation
        if (!name || name.trim() === '') {
            return corsJSON({ error: 'Name is required' }, { status: 400 })
        }

        // Use admin client to update lead
        const adminClient = createAdminClient()

        // First, verify the lead belongs to the user's organization
        const { data: existingLead } = await adminClient
            .from('leads')
            .select('id, organization_id, name')
            .eq('id', id)
            .single()

        if (!existingLead) {
            return corsJSON({ error: 'Lead not found' }, { status: 404 })
        }

        if (existingLead.organization_id !== profile.organization_id) {
            return corsJSON({ error: 'Unauthorized' }, { status: 403 })
        }

        // Update the lead
        console.log(`📝 [Leads PUT] Updating lead ${id}, project_id: ${projectId}`)
        const { data: lead, error } = await adminClient
            .from('leads')
            .update({
                name: name.trim(),
                email: email?.trim() || null,
                phone: phone?.trim() || null,
                project_id: projectId || null,
                status: status || 'new',
                recording_consent: typeof body.recordingConsent === 'boolean' ? body.recordingConsent : undefined,
                notes: notes?.trim() || null
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Lead update error:', error)
            return corsJSON({ error: 'Failed to update lead' }, { status: 500 })
        }

        // Audit log
        try {
            await logAudit(
                supabase,
                user.id,
                profile.full_name || user.email,
                'lead.update',
                'lead',
                lead.id,
                { lead_name: lead.name },
                profile.organization_id
            )
        } catch (auditError) {
            console.error('Audit log error:', auditError)
        }

        return corsJSON({ lead })
    } catch (e) {
        console.error('leads PUT error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}

/**
 * DELETE /api/leads/[id]
 * Delete a lead
 */
export async function DELETE(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, full_name')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const { id } = await params
        const adminClient = createAdminClient()

        // Verify ownership
        const { data: existingLead } = await adminClient
            .from('leads')
            .select('id, organization_id, name')
            .eq('id', id)
            .single()

        if (!existingLead) {
            return corsJSON({ error: 'Lead not found' }, { status: 404 })
        }

        if (existingLead.organization_id !== profile.organization_id) {
            return corsJSON({ error: 'Unauthorized' }, { status: 403 })
        }

        // 1. Break the circular dependency (Lead -> CallLog)
        // If the lead references a call log, we must unlink it first
        const { error: unlinkError } = await adminClient
            .from('leads')
            .update({ call_log_id: null })
            .eq('id', id)

        if (unlinkError) {
            console.error('❌ Failed to unlink call_log_id:', unlinkError)
        }

        // 2. Delete related call_logs (CallLog -> Lead)
        const { error: logsError } = await adminClient
            .from('call_logs')
            .delete()
            .eq('lead_id', id)

        if (logsError) {
            console.error('❌ Failed to cleanup call_logs:', logsError)
        } else {
            console.log('✅ Cleaned up related call_logs')
        }

        // 2. Delete Lead
        const { error } = await adminClient
            .from('leads')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('❌ [Leads DELETE] Lead delete error:', error)
            // Check for foreign key constraint violation (Postgres code 23503)
            if (error.code === '23503') {
                return corsJSON({
                    error: 'Cannot delete lead because it has related data (calls, campaigns).',
                    details: error.message
                }, { status: 400 })
            }
            return corsJSON({ error: 'Failed to delete lead' }, { status: 500 })
        }

        console.log('✅ Lead deleted successfully:', id)

        // Audit log
        try {
            await logAudit(
                supabase,
                user.id,
                profile.full_name || user.email,
                'lead.delete',
                'lead',
                id,
                { lead_name: existingLead.name },
                profile.organization_id
            )
        } catch (auditError) {
            console.error('Audit log error:', auditError)
        }

        return corsJSON({ success: true })
    } catch (e) {
        console.error('leads DELETE error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
