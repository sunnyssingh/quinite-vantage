import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/webhooks/plivo/status
 * Called for call status updates
 * Updates call_logs with current status
 */
export async function POST(request) {
    try {
        const formData = await request.formData()

        const callSid = formData.get('CallUUID')
        const callStatus = formData.get('CallStatus')
        const duration = parseInt(formData.get('Duration') || '0')

        console.log('Call status update:', { callSid, callStatus, duration })

        if (!callSid) {
            return NextResponse.json({ error: 'Missing CallUUID' }, { status: 400 })
        }

        // Map Plivo status to our status
        const statusMap = {
            'ringing': 'ringing',
            'in-progress': 'in_progress',
            'completed': 'completed',
            'busy': 'no_answer',
            'failed': 'failed',
            'no-answer': 'no_answer',
            'canceled': 'failed'
        }

        const mappedStatus = statusMap[callStatus] || callStatus

        // Update call log
        const adminClient = createAdminClient()

        const { error } = await adminClient
            .from('call_logs')
            .update({
                call_status: mappedStatus,
                duration: duration,
                metadata: {
                    plivo_status: callStatus,
                    last_update: new Date().toISOString()
                }
            })
            .eq('call_sid', callSid)

        if (error) {
            console.error('Error updating call status:', error)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Status webhook error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
