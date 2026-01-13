import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request) {
    try {
        const { password } = await request.json()

        if (!password) {
            return NextResponse.json(
                { error: 'Password is required' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        const supabase = await createServerSupabaseClient()

        // Update user password
        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            console.error('Password update error:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json({
            message: 'Password updated successfully'
        })

    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json(
            { error: 'An error occurred. Please try again.' },
            { status: 500 }
        )
    }
}
