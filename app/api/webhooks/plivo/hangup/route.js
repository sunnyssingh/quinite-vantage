import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/webhooks/plivo/hangup
 * Called when a call ends
 * Updates call_logs with final status
 */
export async function POST(request) {
    try {
        const formData = await request.formData()

        const callSid = formData.get('CallUUID')
        const duration = parseInt(formData.get('Duration') || '0')
        const hangupCause = formData.get('HangupCause')
        const billDuration = parseInt(formData.get('BillDuration') || '0')

        console.log('Call hangup:', { callSid, duration, hangupCause })

        if (!callSid) {
            return NextResponse.json({ error: 'Missing CallUUID' }, { status: 400 })
        }

        // Update call log with retry logic
        const adminClient = createAdminClient()
        const MAX_RETRIES = 3
        let updateError

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            updateError = null
            try {
                // First, try to find existing call log
                const { data: existingLog } = await adminClient
                    .from('call_logs')
                    .select('*')
                    .eq('call_sid', callSid)
                    .single()

                if (existingLog) {
                    // Update existing call log
                    const { data, error } = await adminClient
                        .from('call_logs')
                        .update({
                            duration: billDuration,
                            call_status: hangupCause === 'NORMAL_CLEARING' ? 'called' :
                                hangupCause === 'NO_ANSWER' ? 'no_answer' :
                                    hangupCause === 'USER_BUSY' ? 'busy' : 'failed',
                            notes: `Call ended: ${hangupCause}`,
                            ended_at: new Date().toISOString(),
                            metadata: {
                                hangup_cause: hangupCause,
                                total_duration: duration,
                                bill_duration: billDuration
                            }
                        })
                        .eq('call_sid', callSid)
                        .select('lead_id')
                        .single()

                    if (error) throw new Error(error.message)

                    // If call was successful, update lead status to 'contacted'
                    if (data?.lead_id && (hangupCause === 'NORMAL_CLEARING')) {
                        await adminClient
                            .from('leads')
                            .update({
                                status: 'contacted',
                                call_status: 'called'
                            })
                            .eq('id', data.lead_id)
                            .neq('status', 'transferred')
                            .neq('status', 'converted')
                    } else if (data?.lead_id && (hangupCause === 'NO_ANSWER' || hangupCause === 'USER_BUSY')) {
                        // Update lead for unanswered calls
                        await adminClient
                            .from('leads')
                            .update({
                                call_status: hangupCause === 'NO_ANSWER' ? 'no_answer' : 'busy',
                                last_call_attempt: new Date().toISOString()
                            })
                            .eq('id', data.lead_id)
                    }

                    console.log(`✅ Call log updated successfully on attempt ${attempt}`)
                } else {
                    // Call log doesn't exist - call was never answered
                    // Create a basic log for tracking
                    console.log(`⚠️ No existing call log found for ${callSid} - creating one for unanswered call`)

                    const { error: insertError } = await adminClient
                        .from('call_logs')
                        .insert({
                            call_sid: callSid,
                            duration: billDuration,
                            call_status: hangupCause === 'NO_ANSWER' ? 'no_answer' :
                                hangupCause === 'USER_BUSY' ? 'busy' :
                                    hangupCause === 'CANCEL' ? 'cancelled' : 'failed',
                            notes: `Unanswered call: ${hangupCause}`,
                            created_at: new Date().toISOString(),
                            ended_at: new Date().toISOString(),
                            metadata: {
                                hangup_cause: hangupCause,
                                total_duration: duration,
                                bill_duration: billDuration,
                                unanswered: true
                            }
                        })

                    if (insertError) throw new Error(insertError.message)

                    console.log(`✅ Created call log for unanswered call on attempt ${attempt}`)
                }

                // Success
                break
            } catch (err) {
                console.error(`Attempt ${attempt} to update/create call log failed:`, err.message)
                updateError = err

                if (attempt < MAX_RETRIES) {
                    const delay = Math.pow(2, attempt - 1) * 1000
                    await new Promise(resolve => setTimeout(resolve, delay))
                }
            }
        }

        if (updateError) {
            console.error('Final error updating call log:', updateError)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Hangup webhook error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
