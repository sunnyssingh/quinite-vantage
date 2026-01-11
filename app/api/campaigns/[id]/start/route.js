import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission, logAudit } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'
import { makeCall, isPlivoConfigured, validateIndianPhone } from '@/lib/plivo-service'

/**
 * POST /api/campaigns/[id]/start
 * Start campaign and call ALL leads automatically
 */
export async function POST(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permission
        const canRun = await hasPermission(supabase, user.id, 'campaign.run')
        if (!canRun) {
            return corsJSON({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Get user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, full_name')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const { id } = await params
        const adminClient = createAdminClient()

        // Get the campaign
        const { data: campaign } = await adminClient
            .from('campaigns')
            .select('*, project:projects(id, name)')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single()

        if (!campaign) {
            return corsJSON({ error: 'Campaign not found' }, { status: 404 })
        }

        // Validate time window
        const now = new Date()
        const currentDate = now.toISOString().split('T')[0]
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5) // HH:MM

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
        const batchSize = parseInt(searchParams.get('batchSize') || '5')

        console.log(`🚀 Starting campaign batch: ${batchSize} leads`)

        // Get leads for this campaign's project (Batch Processing)
        // Only fetch leads that haven't been called successfully yet
        const { data: leads } = await adminClient
            .from('leads')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .eq('project_id', campaign.project_id)
            // Fix: Include 'not_called' which seems to be the default for some imports
            .in('call_status', ['new', 'pending', 'failed', 'not_called', null])
            .limit(batchSize)

        if (!leads || leads.length === 0) {
            return corsJSON({ error: 'No leads found for this campaign' }, { status: 400 })
        }

        // Check if real calling is enabled
        const enableRealCalling = process.env.ENABLE_REAL_CALLING === 'true'
        const plivoConfigured = isPlivoConfigured()

        let totalCalls = 0
        let transferredCalls = 0
        let failedCalls = 0
        const callLogs = []

        if (enableRealCalling && plivoConfigured) {
            // REAL CALLING MODE
            console.log(`Starting real AI calling for ${leads.length} leads...`)

            for (const lead of leads) {
                // Validate phone number
                if (!lead.phone || !validateIndianPhone(lead.phone)) {
                    console.log(`Skipping ${lead.name}: Invalid phone number`)
                    failedCalls++
                    continue
                }

                // Check recording consent
                if (!lead.recording_consent) {
                    console.log(`Skipping ${lead.name}: No recording consent`)
                    failedCalls++
                    continue
                }

                try {
                    // Make real call via Plivo
                    const callSid = await makeCall(lead.phone, lead.id, campaign.id)

                    // Create call log
                    const { data: callLog } = await adminClient
                        .from('call_logs')
                        .insert({
                            campaign_id: campaign.id,
                            lead_id: lead.id,
                            call_sid: callSid,
                            call_status: 'initiated',
                            call_timestamp: new Date().toISOString(),
                            transferred: false,
                            notes: 'Real AI call initiated'
                        })
                        .select()
                        .single()

                    // Update lead
                    await adminClient
                        .from('leads')
                        .update({
                            call_status: 'calling',
                            call_date: new Date().toISOString()
                        })
                        .eq('id', lead.id)

                    totalCalls++
                    callLogs.push({
                        leadId: lead.id,
                        leadName: lead.name,
                        callSid,
                        status: 'initiated',
                        callLogId: callLog?.id
                    })

                    // Small delay between calls (2 seconds)
                    await new Promise(resolve => setTimeout(resolve, 2000))

                } catch (error) {
                    console.error(`Failed to call ${lead.name}:`, error)
                    failedCalls++
                }
            }

            // Update campaign stats (webhooks will update transferred_calls)
            await adminClient
                .from('campaigns')
                .update({
                    total_calls: totalCalls,
                    status: 'active'
                })
                .eq('id', campaign.id)

            // Audit log
            await logAudit(
                supabase,
                user.id,
                profile.full_name || user.email,
                'campaign.started_real',
                'campaign',
                id,
                {
                    campaign_name: campaign.name,
                    total_leads: leads.length,
                    calls_initiated: totalCalls,
                    failed_calls: failedCalls
                },
                profile.organization_id
            )

            return corsJSON({
                success: true,
                mode: 'real',
                campaign: {
                    id: campaign.id,
                    name: campaign.name,
                    status: 'active'
                },
                summary: {
                    totalLeads: leads.length,
                    callsInitiated: totalCalls,
                    failedCalls,
                    message: `Started calling ${totalCalls} leads. Status will update via webhooks.`,
                    callLogs
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
                        call_status: selectedOutcome.status,
                        transferred_to_human: selectedOutcome.transferred,
                        call_date: new Date().toISOString(),
                        status: selectedOutcome.transferred ? 'qualified' : lead.status
                    })
                    .eq('id', lead.id)

                const callLogData = {
                    campaign_id: campaign.id,
                    lead_id: lead.id,
                    call_status: selectedOutcome.status,
                    transferred: selectedOutcome.transferred,
                    call_timestamp: new Date().toISOString(),
                    duration,
                    notes: selectedOutcome.transferred
                        ? `Simulated: Lead qualified and transferred to ${transferredEmployee?.full_name || 'employee'}`
                        : `Simulated: Call completed - ${selectedOutcome.status.replace('_', ' ')}`
                }

                if (transferredEmployee) {
                    callLogData.transferred_to_user_id = transferredEmployee.id
                    callLogData.transferred_to_phone = transferredEmployee.phone
                }

                const { data: callLog } = await adminClient
                    .from('call_logs')
                    .insert(callLogData)
                    .select()
                    .single()

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
                },
                profile.organization_id
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
