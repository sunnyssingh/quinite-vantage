import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id, taskId } = await params
        const body = await request.json()

        // Get user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Prepare update data
        const updateData = {
            title: body.title,
            description: body.description,
            due_date: body.due_date,
            priority: body.priority,
            status: body.status,
            assigned_to: body.assigned_to
        }

        // If marking as completed, set completed_at
        if (body.status === 'completed' && !body.completed_at) {
            updateData.completed_at = new Date().toISOString()
        }

        // Update task
        const { data, error } = await supabase
            .from('lead_tasks')
            .update(updateData)
            .eq('id', taskId)
            .eq('lead_id', id)
            .select('*')
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ task: data })
    } catch (error) {
        console.error('Error updating task:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id, taskId } = await params
        const body = await request.json()

        // Get user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Prepare update data (only update provided fields)
        const updateData = {}
        if (body.status !== undefined) updateData.status = body.status
        if (body.title !== undefined) updateData.title = body.title
        if (body.description !== undefined) updateData.description = body.description
        if (body.due_date !== undefined) updateData.due_date = body.due_date
        if (body.priority !== undefined) updateData.priority = body.priority
        if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to

        // If marking as completed, set completed_at
        if (body.status === 'completed') {
            updateData.completed_at = new Date().toISOString()
        } else if (body.status === 'pending') {
            updateData.completed_at = null
        }

        // Update task
        const { data, error } = await supabase
            .from('lead_tasks')
            .update(updateData)
            .eq('id', taskId)
            .eq('lead_id', id)
            .select('*')
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ task: data })
    } catch (error) {
        console.error('Error updating task:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id, taskId } = await params

        // Get user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Delete task
        const { error } = await supabase
            .from('lead_tasks')
            .delete()
            .eq('id', taskId)
            .eq('lead_id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting task:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
