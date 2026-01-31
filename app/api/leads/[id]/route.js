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
                project:projects(id, name)
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
