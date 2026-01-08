import { Server } from 'ws'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRealtimeSession, setupConversationTracking } from '@/lib/realtime-session'
import { convertPlivoToOpenAI, convertOpenAIToPlivo } from '@/lib/audio-utils'

/**
 * WebSocket handler for real-time voice streaming
 * Bridges Plivo telephony ↔ OpenAI Realtime API
 */

let wss = null

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const campaignId = searchParams.get('campaignId')
    const callSid = searchParams.get('callSid')

    if (!leadId || !campaignId) {
        return new Response('Missing parameters', { status: 400 })
    }

    // Initialize WebSocket server if not already created
    if (!global.wss) {
        global.wss = new Server({ noServer: true })

        // Handle connection on the global instance
        global.wss.on('connection', (ws, request) => {
            const url = new URL(request.url, `http://${request.headers.host}`)
            const leadId = url.searchParams.get('leadId')
            const campaignId = url.searchParams.get('campaignId')
            const callSid = url.searchParams.get('callSid')

            handleWebSocket(ws, leadId, campaignId, callSid)
        })
    }
    wss = global.wss

    // Upgrade HTTP connection to WebSocket
    const upgradeHeader = request.headers.get('upgrade')
    if (upgradeHeader !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 })
    }

    return new Response(null, {
        status: 101,
        headers: {
            'Upgrade': 'websocket',
            'Connection': 'Upgrade'
        }
    })
}

/**
 * Handle WebSocket connection for voice streaming
 */
export async function handleWebSocket(ws, leadId, campaignId, callSid) {
    console.log(`WebSocket connected for lead ${leadId}, call ${callSid}`)

    try {
        // Get lead and campaign data
        const adminClient = createAdminClient()

        const { data: lead } = await adminClient
            .from('leads')
            .select('*, project:projects(*)')
            .eq('id', leadId)
            .single()

        const { data: campaign } = await adminClient
            .from('campaigns')
            .select('*, organization:organizations(*)')
            .eq('id', campaignId)
            .single()

        if (!lead || !campaign) {
            ws.close(1008, 'Lead or campaign not found')
            return
        }

        // Create call log
        const { data: callLog } = await adminClient
            .from('call_logs')
            .insert({
                campaign_id: campaignId,
                lead_id: leadId,
                call_sid: callSid,
                call_status: 'in_progress',
                call_timestamp: new Date().toISOString(),
                transferred: false
            })
            .select()
            .single()

        // Initialize OpenAI Realtime session
        const realtimeClient = await createRealtimeSession(
            lead,
            campaign,
            callSid,
            callLog.id
        )

        // Setup conversation tracking
        const conversationState = setupConversationTracking(realtimeClient, callLog.id)

        // Connect to OpenAI
        await realtimeClient.connect()

        console.log('OpenAI Realtime connected')

        // Plivo → OpenAI: Forward incoming audio
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString())

                if (data.event === 'media') {
                    // Plivo sends base64 encoded μ-law audio
                    const plivoAudio = Buffer.from(data.media.payload, 'base64')

                    // Convert Plivo format to OpenAI format
                    const openaiAudio = convertPlivoToOpenAI(plivoAudio)

                    // Send to OpenAI
                    await realtimeClient.appendInputAudio(openaiAudio)
                } else if (data.event === 'start') {
                    console.log('Plivo stream started:', data.start)
                } else if (data.event === 'stop') {
                    console.log('Plivo stream stopped')
                    await realtimeClient.disconnect()
                }
            } catch (error) {
                console.error('Error processing Plivo message:', error)
            }
        })

        // OpenAI → Plivo: Forward AI responses
        realtimeClient.on('conversation.item.created', async ({ item }) => {
            if (item.type === 'message' && item.role === 'assistant') {
                console.log('AI response created')
            }
        })

        realtimeClient.on('response.audio.delta', async ({ delta }) => {
            try {
                // OpenAI sends base64 encoded PCM16 audio
                const openaiAudio = Buffer.from(delta, 'base64')

                // Convert OpenAI format to Plivo format
                const plivoAudio = convertOpenAIToPlivo(openaiAudio)

                // Send to Plivo
                const mediaMessage = {
                    event: 'media',
                    media: {
                        payload: plivoAudio.toString('base64')
                    }
                }

                ws.send(JSON.stringify(mediaMessage))
            } catch (error) {
                console.error('Error sending audio to Plivo:', error)
            }
        })

        // Handle errors
        realtimeClient.on('error', (error) => {
            console.error('OpenAI Realtime error:', error)
        })

        ws.on('error', (error) => {
            console.error('WebSocket error:', error)
        })

        // Cleanup on close
        ws.on('close', async () => {
            console.log('WebSocket closed')
            await realtimeClient.disconnect()

            // Save final transcript
            await adminClient
                .from('call_logs')
                .update({
                    transcript: conversationState.transcript,
                    call_status: 'completed'
                })
                .eq('id', callLog.id)
        })

    } catch (error) {
        console.error('WebSocket handler error:', error)
        ws.close(1011, 'Internal server error')
    }
}

// Export for Next.js API route
export const config = {
    api: {
        bodyParser: false
    }
}
