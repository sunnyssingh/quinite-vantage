import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'
import { createVoiceInstructions, getVoiceConfig } from '@/lib/openai-voice'
import { transferCall, hangupCall } from '@/lib/plivo-service'

/**
 * Create and configure OpenAI Realtime session
 * @param {object} lead - Lead information
 * @param {object} campaign - Campaign information
 * @param {string} callSid - Plivo call SID
 * @param {string} callLogId - Call log ID
 * @returns {RealtimeClient} Configured Realtime client
 */
export async function createRealtimeSession(lead, campaign, callSid, callLogId) {
    const client = new RealtimeClient({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowAPIKeyInBrowser: false
    })

    // Get voice configuration
    const voiceConfig = getVoiceConfig(campaign.ai_voice)
    const instructions = createVoiceInstructions(campaign, lead, campaign.organization)

    // Configure session
    await client.updateSession({
        modalities: ['text', 'audio'],
        voice: voiceConfig.voice,
        instructions: instructions,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
            model: 'whisper-1'
        },
        turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
        },
        temperature: 0.8,
        max_response_output_tokens: 4096
    })

    // Add function tools
    client.addTool(
        {
            name: 'transfer_to_human',
            description: 'Transfer the call to a human agent when the lead shows interest',
            parameters: {
                type: 'object',
                properties: {
                    reason: {
                        type: 'string',
                        description: 'Reason for transfer'
                    }
                },
                required: ['reason']
            }
        },
        async ({ reason }) => {
            console.log('Transfer requested:', reason)

            try {
                // Get available employee
                const adminClient = createAdminClient()
                const { data: employeeRole } = await adminClient
                    .from('roles')
                    .select('id')
                    .eq('name', 'Employee')
                    .single()

                const { data: employee } = await adminClient
                    .from('profiles')
                    .select('id, full_name, phone')
                    .eq('organization_id', campaign.organization_id)
                    .eq('role_id', employeeRole?.id)
                    .not('phone', 'is', null)
                    .limit(1)
                    .single()

                if (employee) {
                    // Transfer call via Plivo
                    await transferCall(callSid, employee.phone)

                    // Update call log
                    await adminClient
                        .from('call_logs')
                        .update({
                            transferred: true,
                            transferred_to_user_id: employee.id,
                            transferred_to_phone: employee.phone,
                            notes: `Transferred to ${employee.full_name}: ${reason}`
                        })
                        .eq('id', callLogId)

                    return { success: true, transferred_to: employee.full_name }
                } else {
                    return { success: false, error: 'No employees available' }
                }
            } catch (error) {
                console.error('Transfer error:', error)
                return { success: false, error: error.message }
            }
        }
    )

    client.addTool(
        {
            name: 'end_call',
            description: 'End the call when conversation is complete',
            parameters: {
                type: 'object',
                properties: {
                    reason: {
                        type: 'string',
                        description: 'Reason for ending call'
                    }
                },
                required: ['reason']
            }
        },
        async ({ reason }) => {
            console.log('End call requested:', reason)

            try {
                // Hang up via Plivo
                await hangupCall(callSid)

                // Update call log
                const adminClient = createAdminClient()
                await adminClient
                    .from('call_logs')
                    .update({
                        notes: `Call ended by AI: ${reason}`
                    })
                    .eq('id', callLogId)

                return { success: true }
            } catch (error) {
                console.error('Hangup error:', error)
                return { success: false, error: error.message }
            }
        }
    )

    return client
}

/**
 * Handle conversation events and save transcript
 * @param {RealtimeClient} client - Realtime client
 * @param {string} callLogId - Call log ID
 */
export function setupConversationTracking(client, callLogId) {
    const conversationState = {
        messages: [],
        transcript: '',
        startTime: Date.now()
    }

    // Track conversation items
    client.on('conversation.item.created', ({ item }) => {
        conversationState.messages.push({
            role: item.role,
            content: item.content?.[0]?.transcript || item.content?.[0]?.text || '',
            timestamp: Date.now()
        })
    })

    // Track transcript updates
    client.on('conversation.item.input_audio_transcription.completed', ({ transcript }) => {
        console.log('User said:', transcript)
        conversationState.transcript += `User: ${transcript}\n`
    })

    client.on('response.audio_transcript.done', ({ transcript }) => {
        console.log('AI said:', transcript)
        conversationState.transcript += `AI: ${transcript}\n`
    })

    // Save transcript when conversation ends
    client.on('conversation.interrupted', async () => {
        await saveTranscript(callLogId, conversationState)
    })

    return conversationState
}

/**
 * Save conversation transcript to database
 * @param {string} callLogId - Call log ID
 * @param {object} conversationState - Conversation state
 */
async function saveTranscript(callLogId, conversationState) {
    try {
        const adminClient = createAdminClient()

        const duration = Math.floor((Date.now() - conversationState.startTime) / 1000)

        await adminClient
            .from('call_logs')
            .update({
                transcript: conversationState.transcript,
                duration: duration,
                metadata: {
                    message_count: conversationState.messages.length,
                    conversation_data: conversationState.messages
                }
            })
            .eq('id', callLogId)

        console.log('Transcript saved for call log:', callLogId)
    } catch (error) {
        console.error('Error saving transcript:', error)
    }
}
