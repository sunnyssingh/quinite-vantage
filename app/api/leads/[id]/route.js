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

        // Use admin client to reliably get role
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id, role, full_name')
            .eq('id', user.id)
            .single()

        const isPlatformAdmin = profile?.role === 'platform_admin'

        if (!profile?.organization_id && !isPlatformAdmin) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        // Await params for Next.js 15
        const { id } = await params
        const body = await request.json()

        // Fetch existing lead FIRST to allow partial updates
        const { data: existingLead } = await adminClient
            .from('leads')
            .select('id, organization_id, name, project_id, email, phone, status, notes, stage_id, assigned_to')
            .eq('id', id)
            .single()

        if (!existingLead) {
            return corsJSON({ error: 'Lead not found' }, { status: 404 })
        }

        // Check permission (Platform Admin bypass OR Same Org)
        if (!isPlatformAdmin && existingLead.organization_id !== profile.organization_id) {
            return corsJSON({ error: 'Unauthorized' }, { status: 403 })
        }

        // Prepare new values (Partial Update Support)
        const name = body.name !== undefined ? body.name : existingLead.name
        const email = body.email !== undefined ? body.email : existingLead.email
        const phone = body.phone !== undefined ? body.phone : existingLead.phone
        const projectId = body.projectId !== undefined ? body.projectId : existingLead.project_id
        const status = body.status !== undefined ? body.status : existingLead.status
        const stageId = body.stageId !== undefined ? body.stageId : existingLead.stage_id
        const assignedTo = body.assignedTo !== undefined ? body.assignedTo : existingLead.assigned_to
        const notes = body.notes !== undefined ? body.notes : existingLead.notes

        // Validation
        if (!name || name.trim() === '') {
            return corsJSON({ error: 'Name is required' }, { status: 400 })
        }

        // --- Smart Sync: If Status changed but StageId not provided, try to find matching stage ---
        let resolvedStageId = stageId || null
        const targetProjectId = projectId || existingLead.project_id

        if (status && !stageId && targetProjectId) {
            console.log(`🔄 [SmartSync] Status updated to '${status}', attempts to find matching stage...`)
            try {
                const { data: projectStages } = await adminClient
                    .from('pipeline_stages')
                    .select('id, name')
                    .eq('project_id', targetProjectId)
                    .order('position', { ascending: true })

                if (projectStages && projectStages.length > 0) {
                    // Fuzzy match status to stage name
                    const statusLower = status.toLowerCase()
                    const match = projectStages.find(s =>
                        s.name.toLowerCase().includes(statusLower) ||
                        statusLower.includes(s.name.toLowerCase())
                    )

                    if (match) {
                        console.log(`✅ [SmartSync] Found matching stage: ${match.name} (${match.id})`)
                        resolvedStageId = match.id
                    } else if (status === 'new' && projectStages.length > 0) {
                        // Default 'new' to first stage if no match
                        resolvedStageId = projectStages[0].id
                    }
                }
            } catch (syncError) {
                console.warn('⚠️ [SmartSync] Failed to sync stage:', syncError)
            }
        }
        // -----------------------------------------------------------------------------------------

        // Update the lead
        console.log(`📝 [Leads PUT] Updating lead ${id}, project_id: ${targetProjectId}, stage_id: ${resolvedStageId}`)
        const { data: lead, error } = await adminClient
            .from('leads')
            .update({
                name: name.trim(),
                email: email?.trim() || null,
                phone: phone?.trim() || null,
                project_id: projectId || null,
                status: status || 'new',
                stage_id: resolvedStageId, // CRM Stage (Smart Synced)
                assigned_to: assignedTo || null, // CRM Owner
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
                profile.organization_id || existingLead.organization_id
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

        // Use admin client to reliably get role
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id, role, full_name')
            .eq('id', user.id)
            .single()

        const isPlatformAdmin = profile?.role === 'platform_admin'

        if (!profile?.organization_id && !isPlatformAdmin) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const { id } = await params

        // Verify ownership/existence
        const { data: existingLead } = await adminClient
            .from('leads')
            .select('id, organization_id, name')
            .eq('id', id)
            .single()

        if (!existingLead) {
            return corsJSON({ error: 'Lead not found' }, { status: 404 })
        }

        // Check permission (Platform Admin bypass OR Same Org)
        if (!isPlatformAdmin && existingLead.organization_id !== profile.organization_id) {
            return corsJSON({ error: 'Unauthorized' }, { status: 403 })
        }

        // 1. Break the circular dependency (Lead -> CallLog)
        const { error: unlinkError } = await adminClient
            .from('leads')
            .update({ call_log_id: null })
            .eq('id', id)

        if (unlinkError) {
            console.error('❌ Failed to unlink call_log_id:', unlinkError)
            return corsJSON({ error: 'Failed to unlink lead from call logs' }, { status: 500 })
        }

        // 2. Delete related call_logs (CallLog -> Lead)
        const { error: logsError } = await adminClient
            .from('call_logs')
            .delete()
            .eq('lead_id', id)

        if (logsError) {
            console.error('❌ Failed to cleanup call_logs:', logsError)
            return corsJSON({
                error: 'Failed to delete related call logs',
                details: logsError.message
            }, { status: 500 })
        }

        // 3. Delete Lead
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
                profile.organization_id || existingLead.organization_id
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
