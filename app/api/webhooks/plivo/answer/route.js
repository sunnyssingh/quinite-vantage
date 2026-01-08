import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createVoiceInstructions, getVoiceConfig } from '@/lib/openai-voice'

/**
 * POST /api/webhooks/plivo/answer
 * Called when Plivo connects a call
 * Returns XML to stream audio to WebSocket for real-time conversation
 */
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const campaignId = searchParams.get('campaignId')

    // Extract CallUUID from form data (Plivo sends it in POST body)
    let callUUID = searchParams.get('CallUUID') || searchParams.get('callSid')
    try {
      const formData = await request.formData()
      if (!callUUID) {
        callUUID = formData.get('CallUUID') || formData.get('callSid')
      }
    } catch (e) {
      console.log('No form data in answer request')
    }

    console.log('Call answered:', { leadId, campaignId, callUUID })

    // Get lead and campaign details
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
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Speak>Sorry, there was an error. Goodbye.</Speak>
          <Hangup/>
        </Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    // Check if real-time AI is enabled
    const enableRealtime = process.env.ENABLE_REALTIME_AI === 'true'

    if (enableRealtime && process.env.OPENAI_API_KEY) {
      // REAL-TIME CONVERSATIONAL AI
      const wsBaseUrl = process.env.WS_URL || 'ws://localhost:3001'
      const wsFullUrl = `${wsBaseUrl}/voice/stream?leadId=${leadId}&campaignId=${campaignId}&callSid=${callUUID}`

      // Return Plivo Stream XML for WebSocket connection
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Stream 
    bidirectional="true"
    keepCallAlive="true"
    streamTimeout="86400"
    contentType="audio/x-mulaw;rate=8000"
  >
    ${wsFullUrl}
  </Stream>
</Response>`

      console.log('Returning WebSocket stream XML:', wsFullUrl)
      return new NextResponse(xml, {
        headers: { 'Content-Type': 'text/xml' }
      })

    } else {
      // FALLBACK: Simple TTS (no real-time conversation)
      const greeting = `Hello ${lead.name}, this is a representative from ${campaign.organization.name}.`
      const script = campaign.ai_script || 'We wanted to reach out to you regarding our services.'

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak>${greeting}</Speak>
  <Speak>${script}</Speak>
  <Speak>Thank you for your time. Goodbye.</Speak>
  <Hangup/>
</Response>`

      console.log('Returning simple TTS XML (fallback)')
      return new NextResponse(xml, {
        headers: { 'Content-Type': 'text/xml' }
      })
    }
  } catch (error) {
    console.error('Answer webhook error:', error)

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Speak>Sorry, there was an error. Goodbye.</Speak>
        <Hangup/>
      </Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }
}
