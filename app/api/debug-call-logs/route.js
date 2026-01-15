import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
    const supabase = createAdminClient()
    const results = { steps: [], success: false }

    try {
        // 1. Check Table Existence
        results.steps.push('Checking call_logs table existence...')
        const { count, error: countError } = await supabase.from('call_logs').select('*', { count: 'exact', head: true })

        if (countError) {
            results.steps.push(`❌ Error accessing call_logs: ${countError.message}`)
            return NextResponse.json(results, { status: 500 })
        }
        results.steps.push(`✅ call_logs table exists. Current count: ${count}`)

        // 2. Fetch Prerequisite Data for Insert
        results.steps.push('Fetching valid IDs for test insert...')
        const { data: org } = await supabase.from('organizations').select('id').limit(1).single()
        const { data: project } = await supabase.from('projects').select('id').limit(1).single()
        const { data: campaign } = await supabase.from('campaigns').select('id').limit(1).single()
        const { data: lead } = await supabase.from('leads').select('id').limit(1).single()

        if (!org || !project || !campaign || !lead) {
            results.steps.push('❌ Cannot test insert: Missing prerequisite data (org/project/campaign/lead)')
            results.data = { org, project, campaign, lead }
            return NextResponse.json(results, { status: 400 })
        }

        // 3. Attempt Insert
        results.steps.push('Attempting test insert...')
        const testData = {
            organization_id: org.id,
            project_id: project.id,
            campaign_id: campaign.id,
            lead_id: lead.id,
            call_sid: `test_${Date.now()}`,
            call_status: 'debug_test',
            direction: 'outbound',
            notes: 'Debug test insert'
        }

        const { data: inserted, error: insertError } = await supabase
            .from('call_logs')
            .insert(testData)
            .select()
            .single()

        if (insertError) {
            console.error('Debug Insert Error:', insertError)
            results.steps.push(`❌ Insert Failed: ${insertError.message}`)
            results.details = insertError
        } else {
            results.steps.push(`✅ Insert Success! ID: ${inserted.id}`)
            results.success = true

            // Clean up
            await supabase.from('call_logs').delete().eq('id', inserted.id)
            results.steps.push('✅ Test record cleaned up')
        }

        return NextResponse.json(results)

    } catch (e) {
        results.error = e.message
        return NextResponse.json(results, { status: 500 })
    }
}
