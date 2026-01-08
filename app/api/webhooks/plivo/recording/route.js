import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/webhooks/plivo/recording
 * Called when call recording is available
 * Saves recording URL to database
 */
export async function POST(request) {
    try {
        const formData = await request.formData()

        const callSid = formData.get('CallUUID')
        const recordingUrl = formData.get('RecordUrl')
        const recordingDuration = parseInt(formData.get('RecordingDuration') || '0')
        const recordingFormat = formData.get('RecordingFormat') || 'mp3'

        console.log('Recording available:', { callSid, recordingUrl, recordingDuration })

        if (!callSid || !recordingUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Update call log with recording
        const adminClient = createAdminClient()

        const { error } = await adminClient
            .from('call_logs')
            .update({
                recording_url: recordingUrl,
                recording_duration: recordingDuration,
                recording_format: recordingFormat
            })
            .eq('call_sid', callSid)

        if (error) {
            console.error('Error saving recording:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log('Recording saved successfully')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Recording webhook error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
