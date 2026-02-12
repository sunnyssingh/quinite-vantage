import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'
import { makeCall, isPlivoConfigured, validateIndianPhone } from '@/lib/plivo-service'
import { hasDashboardPermission } from '@/lib/dashboardPermissions'

/**
 * POST /api/campaigns/[id]/start
 * Start campaign and call ALL leads automatically
 */
export async function POST(request, { params }) {
    try {
        console.log('🚀 [Campaign Start] Initiating campaign start...')

        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.log('❌ [Campaign Start] Unauthorized')
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permission
        const canRun = await hasDashboardPermission(user.id, 'run_campaigns')
        if (!canRun) {
            console.log('❌ [Campaign Start] Forbidden - Missing "run_campaigns" permission')
            return corsJSON({
                success: false,
                message: 'You don\'t have permission to run campaigns'
            }, { status: 200 })
        }

        console.log('✅ [Campaign Start] User authenticated:', user.email)

        const { id } = await params
        console.log('📋 [Campaign Start] Campaign ID:', id)

        // Get user's profile
        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id, full_name')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            console.log('❌ [Campaign Start] No organization found')
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        console.log('✅ [Campaign Start] Organization ID:', profile.organization_id)

        // Get campaign
        const { data: campaign, error: campaignError } = await adminClient
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (campaignError || !campaign) {
            console.log('❌ [Campaign Start] Campaign not found')
            return corsJSON({ error: 'Campaign not found' }, { status: 404 })
        }

        console.log('✅ [Campaign Start] Campaign found:', campaign.name)
        console.log('📊 [Campaign Start] Current status:', campaign.status)

        // Validate time window
        // Validate time window (Corrected for IST)
        const now = new Date()

        // Get current date/time in IST (India Standard Time)
        // en-CA gives YYYY-MM-DD format
        const currentDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
        // en-GB gives HH:MM:SS format (24h)
        const currentTime = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }).substring(0, 5)

        console.log(`🕒 [Campaign Start] Server Time: ${now.toISOString()} | IST Time: ${currentDate} ${currentTime}`)

        // Check date range
        if (campaign.start_date && campaign.end_date) {
            if (currentDate < campaign.start_date || currentDate > campaign.end_date) {
                return corsJSON({
                    error: 'Campaign is not within the scheduled date range',
                    details: {
                        currentDate,
                        startDate: campaign.start_date,
                        endDate: campaign.end_date
                    }
                }, { status: 400 })
            }
        }

        // Check time range
        if (campaign.time_start && campaign.time_end) {
            if (currentTime < campaign.time_start || currentTime > campaign.time_end) {
                return corsJSON({
                    error: 'Campaign is not within the scheduled time window',
                    details: {
                        currentTime,
                        timeStart: campaign.time_start,
                        timeEnd: campaign.time_end
                    }
                }, { status: 400 })
            }
        }

        // Parse batch size from query params (Default: 5 calls at a time to prevent overload)
        const { searchParams } = new URL(request.url)
        const batchSize = parseInt(searchParams.get('batchSize') || '50')

        console.log(`🚀 [Campaign Start] Starting campaign batch...`)
        console.log(`   Batch Size: ${batchSize}`)
        console.log(`   Enable Real Calling: ${process.env.ENABLE_REAL_CALLING}`)
        console.log(`   Plivo Configured: ${isPlivoConfigured()}`)

        // Get leads for this campaign's project (Batch Processing)
        console.log(`🔎 Searching for leads with Project ID: ${campaign.project_id}`)

        const { data: leads, error: leadsError } = await adminClient
            .from('leads')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .eq('project_id', campaign.project_id)
            .limit(batchSize)

        if (leadsError) {
            console.error('❌ Leads query error:', leadsError)
        }

        console.log(`🔎 Found ${leads?.length || 0} leads`)

        if (!leads || leads.length === 0) {
            console.log('❌ [Campaign Start] No leads found matching criteria')
            return corsJSON({ error: 'No leads found for this campaign. Ensure leads are assigned to the campaign project.' }, { status: 400 })
        }

        // Check if real calling is enabled
        const enableRealCalling = process.env.ENABLE_REAL_CALLING === 'true'
        const plivoConfigured = isPlivoConfigured()

        let totalCalls = 0
        let transferredCalls = 0
        let failedCalls = 0
        const callLogs = []

        if (enableRealCalling && plivoConfigured) {
            // REAL CALLING MODE - QUEUE BASED

            // Get retry mode from URL (default: 'none' -> Only call new leads)
            // Options: 'none' (default), 'failed' (retry no_answer/busy), 'all' (force retry everything)
            const retryMode = searchParams.get('retryMode') || 'none'
            console.log(`🔄 Campaign Retry Mode: ${retryMode}`)

            // 1. Always exclude currently QUEUED leads to prevent immediate double-dialing
            const { data: existingQueue } = await adminClient
                .from('call_queue')
                .select('lead_id')
                .eq('campaign_id', campaign.id)
                .eq('status', 'queued')

            const queuedLeadIds = new Set(existingQueue?.map(q => q.lead_id) || [])

            // 2. Fetch history based on retry mode
            let calledLeadIds = new Set()

            if (retryMode !== 'all') {
                // Default: skip almost everything that was attempted
                let statusFilter = ['completed', 'transferred', 'voicemail', 'no_answer', 'failed', 'busy']

                if (retryMode === 'failed') {
                    // If retrying failed, we ONLY filter out actual conversations
                    statusFilter = ['completed', 'transferred']
                }

                const { data: existingLogs } = await adminClient
                    .from('call_logs')
                    .select('lead_id')
                    .eq('campaign_id', campaign.id)
                    .in('call_status', statusFilter)

                calledLeadIds = new Set(existingLogs?.map(l => l.lead_id) || [])
            }

            const leadsToCall = leads.filter(lead =>
                !calledLeadIds.has(lead.id) && !queuedLeadIds.has(lead.id)
            )

            console.log(`🚀 Queuing ${leadsToCall.length} leads (Mode: ${retryMode}). Skipped ${leads.length - leadsToCall.length} leads.`)

            const queueInserts = [];
            const validLeadsToUpdate = [];

            for (const lead of leadsToCall) {
                // Normalize phone number (Auto-add +91)
                let phone = lead.phone?.toString().replace(/[\s\-\(\)]/g, '') || ''
                if (/^\d{10}$/.test(phone)) phone = '+91' + phone
                else if (/^91\d{10}$/.test(phone)) phone = '+' + phone

                // Validate phone number
                if (!phone || !validateIndianPhone(phone)) {
                    console.log(`Skipping ${lead.name}: Invalid phone number (${lead.phone})`)
                    failedCalls++
                    continue
                }

                // Prepare Data
                queueInserts.push({
                    campaign_id: campaign.id,
                    lead_id: lead.id,
                    organization_id: profile.organization_id,
                    status: 'queued',
                    created_at: new Date().toISOString()
                });

                // Track leads to update their specific phone format if changed
                if (phone !== lead.phone) {
                    validLeadsToUpdate.push({ id: lead.id, phone });
                }
            }

            if (queueInserts.length > 0) {
                // Bulk Insert into Queue
                // Bulk Insert into Queue (Idempotent)
                const { error: queueError } = await adminClient
                    .from('call_queue')
                    .upsert(queueInserts, { onConflict: 'campaign_id, lead_id', ignoreDuplicates: true });

                if (queueError) {
                    console.error("Queue Insert Error:", queueError);
                    return corsJSON({ error: 'Failed to add leads to queue' }, { status: 500 });
                }

                // Update Campaign Status
                await adminClient
                    .from('campaigns')
                    .update({ status: 'running', total_calls: 0 }) // total_calls will count completed ones later? Or we just count queued?
                    // Actually, total_calls typically means attempted. Let's keep it 0 effectively until worker updates it? 
                    // Or keep it as 'scheduled'.
                    .eq('id', campaign.id);

                // Update Lead Phones if Normalized
                // Optimization: Maybe do this async or skip if minor.
                // For now, let's just proceed.
            }

            // Audit
            await logAudit(
                supabase, user.id, profile.full_name, 'campaign.queued', 'campaign', id,
                { queued: queueInserts.length, failed_validation: failedCalls }
            );

            return corsJSON({
                success: true,
                mode: 'queued',
                campaign: {
                    id: campaign.id,
                    name: campaign.name,
                    status: 'running'
                },
                summary: {
                    totalLeads: leads.length,
                    queued: queueInserts.length,
                    failedValidation: failedCalls,
                    message: `Successfully queued ${queueInserts.length} calls. Background worker will process them.`
                }
            })

        } else {
            // SIMULATION MODE (fallback)
            console.log(`Starting simulated calling for ${leads.length} leads...`)

            // Get available employees
            const { data: employeeRole } = await adminClient
                .from('roles')
                .select('id')
                .eq('name', 'Employee')
                .single()

            const { data: availableEmployees } = await adminClient
                .from('profiles')
                .select('id, full_name, phone')
                .eq('organization_id', profile.organization_id)
                .eq('role_id', employeeRole?.id)
                .not('phone', 'is', null)

            const outcomes = [
                { status: 'called', transferred: false, weight: 30 },
                { status: 'transferred', transferred: true, weight: 25 },
                { status: 'no_answer', transferred: false, weight: 25 },
                { status: 'voicemail', transferred: false, weight: 20 }
            ]

            const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0)

            for (const lead of leads) {
                const random = Math.random() * totalWeight
                let cumulative = 0
                let selectedOutcome = outcomes[0]

                for (const outcome of outcomes) {
                    cumulative += outcome.weight
                    if (random <= cumulative) {
                        selectedOutcome = outcome
                        break
                    }
                }

                const duration = Math.floor(Math.random() * 150) + 30

                let transferredEmployee = null
                if (selectedOutcome.transferred && availableEmployees && availableEmployees.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableEmployees.length)
                    transferredEmployee = availableEmployees[randomIndex]
                }

                await adminClient
                    .from('leads')
                    .update({
                        transferred_to_human: selectedOutcome.transferred,
                        last_contacted_at: new Date().toISOString()
                    })
                    .eq('id', lead.id)

                const callLogData = {
                    campaign_id: campaign.id,
                    lead_id: lead.id,
                    call_status: selectedOutcome.status,
                    transferred: selectedOutcome.transferred,
                    duration,
                    notes: selectedOutcome.transferred
                        ? `Simulated: Lead qualified and transferred to ${transferredEmployee?.full_name || 'employee'}`
                        : `Simulated: Call completed - ${selectedOutcome.status.replace('_', ' ')}`
                }

                if (transferredEmployee) {
                    callLogData.transferred_to_user_id = transferredEmployee.id
                    callLogData.transferred_to_phone = transferredEmployee.phone
                }

                console.log('📝 [Simulation] Inserting call log:', JSON.stringify(callLogData, null, 2))

                const { data: callLog, error: simError } = await adminClient
                    .from('call_logs')
                    .insert(callLogData)
                    .select()
                    .single()

                if (simError) {
                    console.error('❌ [Simulation] Failed to insert log:', simError)
                } else {
                    console.log('✅ [Simulation] Log created:', callLog?.id)
                }

                totalCalls++
                if (selectedOutcome.transferred) {
                    transferredCalls++
                }

                callLogs.push({
                    leadId: lead.id,
                    leadName: lead.name,
                    outcome: selectedOutcome.status,
                    transferred: selectedOutcome.transferred,
                    transferredTo: transferredEmployee?.full_name,
                    duration,
                    callLogId: callLog?.id
                })
            }

            const conversionRate = totalCalls > 0 ? (transferredCalls / totalCalls * 100).toFixed(2) : 0

            await adminClient
                .from('campaigns')
                .update({
                    total_calls: totalCalls,
                    transferred_calls: transferredCalls,
                    conversion_rate: parseFloat(conversionRate),
                    status: 'completed'
                })
                .eq('id', campaign.id)

            await logAudit(
                supabase,
                user.id,
                profile.full_name || user.email,
                'campaign.started_simulated',
                'campaign',
                id,
                {
                    campaign_name: campaign.name,
                    total_calls: totalCalls,
                    transferred_calls: transferredCalls,
                    conversion_rate: conversionRate
                }
            )

            return corsJSON({
                success: true,
                mode: 'simulated',
                campaign: {
                    id: campaign.id,
                    name: campaign.name,
                    status: 'completed'
                },
                summary: {
                    totalCalls,
                    transferredCalls,
                    conversionRate: `${conversionRate}%`,
                    callLogs
                }
            })
        }
    } catch (e) {
        console.error('campaign start error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
