
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function DELETE(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { id } = await params

        // Get user profile
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()

        // Delete deal
        const { error } = await adminClient
            .from('deals')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting deal:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in deals DELETE:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
