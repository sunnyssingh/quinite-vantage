import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabase = await createServerSupabaseClient()
        await supabase.auth.exchangeCodeForSession(code)
    }

    // Redirect to home page or specific next page after email confirmation
    const next = requestUrl.searchParams.get('next')
    if (next) {
        return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    return NextResponse.redirect(new URL('/', requestUrl.origin))
}
