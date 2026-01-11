import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get Organisation ID from profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const { leads, projectId } = await request.json()

        if (!Array.isArray(leads) || leads.length === 0) {
            return NextResponse.json({ error: 'Invalid leads data' }, { status: 400 })
        }

        // Prepare data for insert
        const leadsToInsert = []
        const invalidLeads = []

        for (const lead of leads) {
            let phone = lead.phone

            if (!phone) {
                invalidLeads.push(lead)
                continue
            }

            // Server-side cleaning & formatting logic (Mirrors Frontend)
            // 1. Clean (remove spaces/dashes/parentheses)
            let cleanPhone = phone.toString().replace(/[\s\-\(\)]/g, '')

            // 2. Format
            if (/^\d{10}$/.test(cleanPhone)) {
                cleanPhone = '+91' + cleanPhone
            } else if (/^91\d{10}$/.test(cleanPhone)) {
                cleanPhone = '+' + cleanPhone
            }

            // 3. Validate (+91XXXXXXXXXX)
            if (!/^\+91\d{10}$/.test(cleanPhone)) {
                // If it fails validation after cleaning, skip it
                console.warn(`Skipping invalid phone number: ${phone} -> ${cleanPhone}`)
                invalidLeads.push(lead)
                continue
            }

            leadsToInsert.push({
                organization_id: profile.organization_id,
                project_id: projectId || null,
                name: lead.name,
                email: lead.email || null,
                phone: cleanPhone, // Store the clean +91 format
                status: lead.status || 'new',
                source: 'csv_upload',
                notes: lead.notes || null,
                created_by: user.id
            })
        }

        if (leadsToInsert.length === 0) {
            return NextResponse.json({ error: 'No valid leads with phone numbers found' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('leads')
            .insert(leadsToInsert)
            .select()

        if (error) {
            console.error('Initial insert error:', error)
            // Retry logic or detail error handling could go here
            throw error
        }

        return NextResponse.json({ success: true, count: data.length })

    } catch (error) {
        console.error('Error uploading leads:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to upload leads' },
            { status: 500 }
        )
    }
}
