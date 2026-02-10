import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/contact/sales
 * Submit enterprise sales inquiry
 */
export async function POST(request) {
    try {
        const supabase = createAdminClient()

        const { data: { user } } = await supabase.auth.getUser()

        const body = await request.json()
        const { name, email, company, phone, message, user_count } = body

        // Validate required fields
        if (!name || !email || !company) {
            return NextResponse.json(
                { error: 'Name, email, and company are required' },
                { status: 400 }
            )
        }

        // Store inquiry in database (you can create a sales_inquiries table)
        // For now, just log it
        console.log('Enterprise Sales Inquiry:', {
            name,
            email,
            company,
            phone,
            message,
            user_count,
            user_id: user?.id,
            timestamp: new Date().toISOString()
        })

        // TODO: Send email notification to sales team
        // TODO: Integrate with CRM or sales platform

        return NextResponse.json({
            message: 'Thank you for your interest! Our sales team will contact you within 24 hours.',
            success: true
        })
    } catch (error) {
        console.error('Error in POST /api/contact/sales:', error)
        return NextResponse.json(
            { error: 'Failed to submit inquiry' },
            { status: 500 }
        )
    }
}
