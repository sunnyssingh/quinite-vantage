import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/permissions'

function handleCORS(response) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
}

export async function GET(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

        const admin = createAdminClient()
        const { data: profile } = await admin.from('profiles').select('organization_id').eq('id', user.id).single()

        if (!profile) {
            return handleCORS(NextResponse.json({ error: 'Profile not found' }, { status: 404 }))
        }

        const { id } = await params

        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (error) throw error
        if (!data) return handleCORS(NextResponse.json({ error: 'Campaign not found' }, { status: 404 }))

        return handleCORS(NextResponse.json({ campaign: data }))
    } catch (e) {
        console.error('campaigns GET by ID error:', e)
        return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
    }
}

export async function PUT(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const body = await request.json()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

        const admin = createAdminClient()
        const { data: profile } = await admin.from('profiles').select('organization_id, full_name').eq('id', user.id).single()

        if (!profile) {
            return handleCORS(NextResponse.json({ error: 'Profile not found' }, { status: 404 }))
        }

        const { id } = await params

        // Verify campaign belongs to user's org
        const { data: existing } = await supabase
            .from('campaigns')
            .select('id')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (!existing) {
            return handleCORS(NextResponse.json({ error: 'Campaign not found' }, { status: 404 }))
        }

        const { project_id, name, description, start_date, end_date, time_start, time_end, status, metadata } = body

        const updatePayload = {
            ...(project_id !== undefined && { project_id }),
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(start_date !== undefined && { start_date }),
            ...(end_date !== undefined && { end_date }),
            ...(time_start !== undefined && { time_start }),
            ...(time_end !== undefined && { time_end }),
            ...(status !== undefined && { status }),
            ...(metadata !== undefined && { metadata }),
            updated_at: new Date().toISOString()
        }

        const { data: campaign, error } = await supabase
            .from('campaigns')
            .update(updatePayload)
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .select()
            .single()

        if (error) throw error

        try {
            await logAudit(supabase, user.id, profile.full_name || user.email, 'campaign.update', 'campaign', id, updatePayload)
        } catch (e) {
            console.error('Audit log error:', e)
        }

        return handleCORS(NextResponse.json({ campaign }))
    } catch (e) {
        console.error('campaigns PUT error:', e)
        return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
    }
}

export async function DELETE(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

        const admin = createAdminClient()
        const { data: profile } = await admin.from('profiles').select('organization_id, full_name').eq('id', user.id).single()

        if (!profile) {
            return handleCORS(NextResponse.json({ error: 'Profile not found' }, { status: 404 }))
        }

        const { id } = await params

        // Verify campaign belongs to user's org
        const { data: existing } = await supabase
            .from('campaigns')
            .select('id')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (!existing) {
            return handleCORS(NextResponse.json({ error: 'Campaign not found' }, { status: 404 }))
        }

        // 1. Delete related call_logs first (Manual Cascade)
        const { error: logsError } = await supabase
            .from('call_logs')
            .delete()
            .eq('campaign_id', id)

        if (logsError) {
            console.error('❌ [Campaign DELETE] Failed to cleanup call_logs:', logsError)
        } else {
            console.log('✅ [Campaign DELETE] Cleaned up related call_logs')
        }

        // 2. Delete Campaign
        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', id)
            .eq('organization_id', profile.organization_id)

        if (error) {
            console.error('❌ [Campaign DELETE] Delete error:', error)
            throw error
        }

        try {
            await logAudit(supabase, user.id, profile.full_name || user.email, 'campaign.delete', 'campaign', id, {})
        } catch (e) {
            console.error('Audit log error:', e)
        }

        return handleCORS(NextResponse.json({ success: true }))
    } catch (e) {
        console.error('campaigns DELETE error:', e)
        return handleCORS(NextResponse.json({ error: e.message }, { status: 500 }))
    }
}

export async function OPTIONS(request) {
    return handleCORS(new NextResponse(null, { status: 200 }))
}
