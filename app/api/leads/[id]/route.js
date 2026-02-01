import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id } = await params

        // Get user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get lead
        const { data, error } = await supabase
            .from('leads')
            .select(`
                *,
                project:projects(id, name),
                deals(*)
            `)
            .eq('id', id)
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ lead: data })
    } catch (error) {
        console.error('Error fetching lead:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id } = await params
        const body = await request.json()

        // Get user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Prepare update data
        const updateData = {}

        // Allow updating specific fields
        if (body.name !== undefined) updateData.name = body.name
        if (body.email !== undefined) updateData.email = body.email
        if (body.phone !== undefined) updateData.phone = body.phone
        if (body.status !== undefined) updateData.status = body.status
        if (body.stageId !== undefined) updateData.stage_id = body.stageId
        if (body.projectId !== undefined) updateData.project_id = body.projectId
        if (body.call_status !== undefined) updateData.call_status = body.call_status
        if (body.notes !== undefined) updateData.notes = body.notes
        if (body.mobile !== undefined) updateData.mobile = body.mobile
        if (body.title !== undefined) updateData.title = body.title
        if (body.department !== undefined) updateData.department = body.department
        if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url

        // Update lead
        const { data, error } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating lead:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ lead: data })
    } catch (error) {
        console.error('Error updating lead:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id } = await params

        // Get user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Delete lead
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting lead:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('Error deleting lead:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
