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

        // Cleanup completed tasks older than 24 hours
        try {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            await supabase
                .from('lead_tasks')
                .delete()
                .eq('lead_id', id)
                .eq('status', 'completed')
                .lt('completed_at', yesterday)
        } catch (cleanupError) {
            console.error('Error cleaning up old tasks:', cleanupError)
            // Continue execution even if cleanup fails
        }

        // Get tasks
        const { data, error } = await supabase
            .from('lead_tasks')
            .select('*')
            .eq('lead_id', id)
            .order('due_date', { ascending: true, nullsFirst: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ tasks: data })
    } catch (error) {
        console.error('Error fetching tasks:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id } = await params
        const body = await request.json()

        // Get user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's organization
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 403 })
        }

        const { data, error } = await supabase
            .from('lead_tasks')
            .insert({
                lead_id: id,
                organization_id: profile.organization_id,
                title: body.title,
                description: body.description,
                due_date: body.due_date,
                due_time: body.due_time,
                priority: body.priority || 'medium',
                status: body.status || 'pending',
                assigned_to: body.assigned_to,
                created_by: user.id
            })
            .select('*')
            .single()

        if (error) {
            console.error('Supabase error creating task:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ task: data })
    } catch (error) {
        console.error('Error creating task:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
