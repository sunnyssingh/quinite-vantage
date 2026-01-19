import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Use admin client to reliably get role
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single()

        const isPlatformAdmin = profile?.role === 'platform_admin'

        if (!profile?.organization_id && !isPlatformAdmin) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const { leads, projectId } = await request.json()

        let targetOrgId = profile.organization_id

        // If Platform Admin and no org in profile, try to get org from project
        if (isPlatformAdmin && !targetOrgId && projectId) {
            const { data: project } = await adminClient
                .from('projects')
                .select('organization_id')
                .eq('id', projectId)
                .single()

            if (project) {
                targetOrgId = project.organization_id
            }
        }

        if (!targetOrgId) {
            return NextResponse.json({ error: 'Target Organization not found. Please select a project.' }, { status: 400 })
        }

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
                organization_id: targetOrgId,
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

        const { data, error } = await adminClient
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
