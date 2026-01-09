import { NextResponse } from 'next/server'

/**
 * POST /api/webhooks/plivo/stream-status
 * Receives stream status events from Plivo
 */
export async function POST(request) {
    try {
        const formData = await request.formData()
        const event = formData.get('Event')
        const callSid = formData.get('CallUUID')
        const streamId = formData.get('StreamID')

        console.log(`[${callSid}] Stream event: ${event}`, {
            streamId,
            event,
            callSid
        })

        // Log different stream events
        switch (event) {
            case 'StartStream':
                console.log(`[${callSid}] ✅ Stream started successfully`)
                break
            case 'StopStream':
                console.log(`[${callSid}] Stream stopped`)
                break
            case 'DroppedStream':
                console.error(`[${callSid}] ❌ Stream dropped - connection failed`)
                break
            case 'DegradedStream':
                console.warn(`[${callSid}] ⚠️  Stream degraded - network issues`)
                break
            default:
                console.log(`[${callSid}] Unknown stream event: ${event}`)
        }

        return new NextResponse('OK', { status: 200 })
    } catch (error) {
        console.error('Stream status webhook error:', error)
        return new NextResponse('Error', { status: 500 })
    }
}
