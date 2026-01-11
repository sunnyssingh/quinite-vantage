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
                const { error } = await adminClient
                    .from('call_logs')
                    .update({
                        duration: billDuration,
                        call_status: hangupCause === 'NORMAL_CLEARING' ? 'called' : 'no_answer', // 'completed'/'failed' not allowed by DB constraint
                        notes: `Call ended: ${hangupCause}`,
                        metadata: {
                            hangup_cause: hangupCause,
                            total_duration: duration,
                            bill_duration: billDuration
                        }
                    })
                    .eq('call_sid', callSid)

                if (error) throw new Error(error.message)

                // Success
                console.log(`Call log updated successfully on attempt ${attempt}`)
                break
            } catch (err) {
                console.error(`Attempt ${attempt} to update call log failed:`, err.message)
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
