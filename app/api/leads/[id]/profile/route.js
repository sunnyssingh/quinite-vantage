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

        // Get user's organization
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 403 })
        }

        // Get lead profile or create if doesn't exist
        let { data: leadProfile, error } = await supabase
            .from('lead_profiles')
            .select('*')
            .eq('lead_id', id)
            .single()

        if (error && error.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { data: newProfile, error: createError } = await supabase
                .from('lead_profiles')
                .insert({
                    lead_id: id,
                    organization_id: profile.organization_id
                })
                .select()
                .single()

            if (createError) {
                return NextResponse.json({ error: createError.message }, { status: 500 })
            }

            leadProfile = newProfile
        } else if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ profile: leadProfile })
    } catch (error) {
        console.error('Error fetching lead profile:', error)
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

        // Update lead profile
        const { data, error } = await supabase
            .from('lead_profiles')
            .update({
                company: body.company,
                job_title: body.job_title,
                location: body.location,
                industry: body.industry,
                lead_score: body.lead_score,
                engagement_level: body.engagement_level,
                budget_range: body.budget_range,
                timeline: body.timeline,
                pain_points: body.pain_points,
                competitor_mentions: body.competitor_mentions,
                preferred_contact_method: body.preferred_contact_method,
                best_contact_time: body.best_contact_time,
                preferences: body.preferences,
                custom_fields: body.custom_fields
            })
            .eq('lead_id', id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ profile: data })
    } catch (error) {
        console.error('Error updating lead profile:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
