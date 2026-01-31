import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { corsJSON } from '@/lib/cors'

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) throw error

        return corsJSON({ notifications })
    } catch (e) {
        console.error('Notifications GET error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}

export async function PATCH(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, mark_all_read } = body

        if (mark_all_read) {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false)

            if (error) throw error
            return corsJSON({ success: true })
        }

        if (id) {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id)
                .eq('user_id', user.id)

            if (error) throw error
            return corsJSON({ success: true })
        }

        return corsJSON({ error: 'Missing parameters' }, { status: 400 })

    } catch (e) {
        console.error('Notifications PATCH error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const id = url.searchParams.get('id')
        const clearAll = url.searchParams.get('all') === 'true'

        if (clearAll) {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id)

            if (error) throw error
            return corsJSON({ success: true })
        }

        if (id) {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id)

            if (error) throw error
            return corsJSON({ success: true })
        }

        return corsJSON({ error: 'Missing parameters' }, { status: 400 })

    } catch (e) {
        console.error('Notifications DELETE error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
