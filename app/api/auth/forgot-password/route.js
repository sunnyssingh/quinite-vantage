import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        const supabase = await createServerSupabaseClient()

        // Send password reset email
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
        })

        if (error) {
            console.error('Password reset error:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json({
            message: 'Password reset email sent successfully. Please check your inbox.'
        })

    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json(
            { error: 'An error occurred. Please try again.' },
            { status: 500 }
        )
    }
}
