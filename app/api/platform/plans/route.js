import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export async function GET(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check platform admin access
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'platform_admin') {
            return corsJSON({ error: 'Platform Admin access required' }, { status: 403 })
        }

        const { data: plans, error } = await adminClient
            .from('subscription_plans')
            .select('*')
            .order('sort_order', { ascending: true })

        if (error) throw error

        return corsJSON({ plans })
    } catch (e) {
        console.error('platform/plans GET error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check platform admin access
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'platform_admin') {
            return corsJSON({ error: 'Platform Admin access required' }, { status: 403 })
        }

        const body = await request.json()
        const { name, slug, description, price_monthly, price_yearly, features, is_active, sort_order } = body

        if (!name || !slug || !features) {
            return corsJSON({ error: 'Missing required fields' }, { status: 400 })
        }

        const { data: plan, error } = await adminClient
            .from('subscription_plans')
            .insert({
                name,
                slug,
                description,
                price_monthly: price_monthly || 0,
                price_yearly: price_yearly || 0,
                features,
                is_active: is_active !== undefined ? is_active : true,
                sort_order: sort_order || 0
            })
            .select()
            .single()

        if (error) throw error

        // Log action
        await adminClient.from('audit_logs').insert({
            user_id: user.id,
            user_name: profile.email || 'Platform Admin',
            action: 'PLAN_CREATED',
            entity_type: 'subscription_plan',
            entity_id: plan.id,
            metadata: { plan_name: name, slug }
        })

        return corsJSON({ success: true, plan })
    } catch (e) {
        console.error('platform/plans POST error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check platform admin access
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'platform_admin') {
            return corsJSON({ error: 'Platform Admin access required' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return corsJSON({ error: 'Missing plan ID' }, { status: 400 })
        }

        const body = await request.json()
        const { name, description, price_monthly, price_yearly, features, is_active, sort_order } = body

        const updateData = {}
        if (name) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (price_monthly !== undefined) updateData.price_monthly = price_monthly
        if (price_yearly !== undefined) updateData.price_yearly = price_yearly
        if (features) updateData.features = features
        if (is_active !== undefined) updateData.is_active = is_active
        if (sort_order !== undefined) updateData.sort_order = sort_order

        const { data: plan, error } = await adminClient
            .from('subscription_plans')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        // Log action
        await adminClient.from('audit_logs').insert({
            user_id: user.id,
            user_name: profile.email || 'Platform Admin',
            action: 'PLAN_UPDATED',
            entity_type: 'subscription_plan',
            entity_id: id,
            metadata: { updateData }
        })

        return corsJSON({ success: true, plan })
    } catch (e) {
        console.error('platform/plans PUT error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
