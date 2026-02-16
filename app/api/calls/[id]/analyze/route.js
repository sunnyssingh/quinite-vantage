import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

/**
 * POST /api/calls/[id]/analyze
 * Manually trigger sentiment analysis for a call
 */
export async function POST(request, res) {
    try {
        const params = await res.params
        const { id: callId } = params

        console.log(`🔍 [Analyze Call] Starting analysis for call: ${callId}`)

        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()

        // Get call log with transcript
        const { data: callLog, error: callError } = await adminClient
            .from('call_logs')
            .select('*')
            .eq('id', callId)
            .single()

        if (callError || !callLog) {
            console.error('❌ Call not found:', callError)
            return NextResponse.json({ error: 'Call not found' }, { status: 404 })
        }

        if (!callLog.conversation_transcript) {
            return NextResponse.json({ error: 'No transcript available for this call' }, { status: 400 })
        }

        console.log(`📝 [Analyze Call] Transcript length: ${callLog.conversation_transcript.length} characters`)

        // Check if insights already exist
        const { data: existingInsights } = await adminClient
            .from('conversation_insights')
            .select('id')
            .eq('call_log_id', callId)
            .single()

        if (existingInsights) {
            console.log(`⚠️  [Analyze Call] Insights already exist, updating...`)
        }

        // Analyze with GPT-4
        console.log(`🤖 [Analyze Call] Calling OpenAI GPT-4...`)

        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert at analyzing sales call transcripts. Analyze the following conversation and extract key insights in JSON format.

Return ONLY a valid JSON object with these exact fields:
{
  "overall_sentiment": <number between -1.0 and 1.0>,
  "sentiment_label": "<positive|neutral|negative>",
  "primary_emotion": "<string>",
  "intent": "<string>",
  "interest_level": "<high|medium|low>",
  "objections": ["<objection1>", "<objection2>"],
  "budget_mentioned": <boolean>,
  "budget_range": "<string or null>",
  "timeline_mentioned": <boolean>,
  "timeline": "<string or null>",
  "key_phrases": ["<phrase1>", "<phrase2>"],
  "recommended_action": "<string>",
  "priority_score": <integer 0-100>
}`
                },
                {
                    role: 'user',
                    content: `Analyze this sales call transcript:\n\n${callLog.conversation_transcript}`
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        })

        const analysisText = completion.choices[0].message.content.trim()
        console.log(`✅ [Analyze Call] GPT-4 response received`)

        // Parse JSON response
        let analysis
        try {
            // Remove markdown code blocks if present
            const jsonText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
            analysis = JSON.parse(jsonText)
        } catch (parseError) {
            console.error('❌ Failed to parse GPT-4 response:', analysisText)
            throw new Error('Invalid JSON response from GPT-4')
        }

        // Save or update insights
        const insightData = {
            call_log_id: callId,
            lead_id: callLog.lead_id,
            organization_id: callLog.organization_id,
            overall_sentiment: analysis.overall_sentiment,
            sentiment_label: analysis.sentiment_label,
            primary_emotion: analysis.primary_emotion,
            intent: analysis.intent,
            interest_level: analysis.interest_level,
            objections: analysis.objections || [],
            budget_mentioned: analysis.budget_mentioned || false,
            budget_range: analysis.budget_range,
            timeline_mentioned: analysis.timeline_mentioned || false,
            timeline: analysis.timeline,
            key_phrases: analysis.key_phrases || [],
            recommended_action: analysis.recommended_action,
            priority_score: analysis.priority_score,
            purchase_readiness: analysis.timeline_mentioned ? 'short_term' : 'long_term', // Derived field
            analyzed_at: new Date().toISOString()
        }

        let savedInsight
        if (existingInsights) {
            // Update existing
            const { data, error } = await adminClient
                .from('conversation_insights')
                .update(insightData)
                .eq('id', existingInsights.id)
                .select()
                .single()

            if (error) throw error
            savedInsight = data
        } else {
            // Create new
            const { data, error } = await adminClient
                .from('conversation_insights')
                .insert(insightData)
                .select()
                .single()

            if (error) throw error
            savedInsight = data
        }

        // Update call_logs with sentiment
        await adminClient
            .from('call_logs')
            .update({
                sentiment_score: analysis.overall_sentiment,
                interest_level: analysis.interest_level
            })
            .eq('id', callId)

        // Update lead with insights
        if (callLog.lead_id) {
            await adminClient
                .from('leads')
                .update({
                    last_sentiment_score: analysis.overall_sentiment,
                    interest_level: analysis.interest_level,
                    purchase_readiness: analysis.timeline_mentioned ? 'short_term' : 'long_term'
                })
                .eq('id', callLog.lead_id)
        }

        console.log(`✅ [Analyze Call] Analysis complete and saved`)

        return NextResponse.json({
            success: true,
            insight: savedInsight,
            message: 'Call analyzed successfully'
        })

    } catch (error) {
        console.error('❌ [Analyze Call] Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to analyze call'
        }, { status: 500 })
    }
}
