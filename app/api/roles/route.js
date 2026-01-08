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

        const { data: roles, error } = await supabase
            .from('roles')
            .select('id, name, description')
            .order('name')

        if (error) throw error

        return corsJSON({ roles })
    } catch (e) {
        console.error('roles GET error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
