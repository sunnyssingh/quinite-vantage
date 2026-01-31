import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id } = await params
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // Filter by interaction type

        // Get user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Build query
        let query = supabase
            .from('lead_interactions')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false })

        // Apply type filter if provided
        if (type) {
            query = query.eq('type', type)
        }

        const { data, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ interactions: data })
    } catch (error) {
        console.error('Error fetching interactions:', error)
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

        // Create interaction
        const { data, error } = await supabase
            .from('lead_interactions')
            .insert({
                lead_id: id,
                organization_id: profile.organization_id,
                type: body.type,
                direction: body.direction,
                subject: body.subject,
                content: body.content,
                duration: body.duration,
                outcome: body.outcome,
                created_by: user.id
            })
            .select('*')
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ interaction: data })
    } catch (error) {
        console.error('Error creating interaction:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
