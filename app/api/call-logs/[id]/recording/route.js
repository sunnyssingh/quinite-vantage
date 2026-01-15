import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'

/**
 * GET /api/call-logs/[id]/recording
 * Get call recording details and URL
 */
export async function GET(request, { params }) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return corsJSON({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permission
        const canView = await hasPermission(supabase, user.id, 'analytics.view')
        if (!canView) {
            return corsJSON({ error: 'Permission denied' }, { status: 403 })
        }

        const { id } = await params

        // Get user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!profile?.organization_id) {
            return corsJSON({ error: 'Organization not found' }, { status: 400 })
        }

        const adminClient = createAdminClient()

        // Get call log with recording
        const { data: callLog, error } = await adminClient
            .from('call_logs')
            .select(`
        id,
        call_sid,
        recording_url,
        recording_duration,
        recording_format,
        recording_format,
        transcript,
        created_at,
        duration,
        call_status,
        transferred,
        leads (
          id,
          name,
          email,
          phone,
          recording_consent
        ),
        campaigns (
          id,
          name,
          organization_id
        )
      `)
            .eq('id', id)
            .single()

        if (error || !callLog) {
            return corsJSON({ error: 'Call log not found' }, { status: 404 })
        }

        // Verify organization
        if (callLog.campaigns?.organization_id !== profile.organization_id) {
            return corsJSON({ error: 'Unauthorized' }, { status: 403 })
        }

        // Check if recording exists
        if (!callLog.recording_url) {
            return corsJSON({
                error: 'No recording available',
                hasRecording: false
            }, { status: 404 })
        }

        // Check consent
        if (!callLog.leads?.recording_consent) {
            return corsJSON({
                error: 'Recording consent not provided',
                hasRecording: false
            }, { status: 403 })
        }

        return corsJSON({
            callLog: {
                id: callLog.id,
                callSid: callLog.call_sid,
                recordingUrl: callLog.recording_url,
                recordingDuration: callLog.recording_duration,
                recordingFormat: callLog.recording_format,
                transcript: callLog.transcript,
                callTimestamp: callLog.created_at,
                duration: callLog.duration,
                status: callLog.call_status,
                transferred: callLog.transferred,
                lead: callLog.leads,
                campaign: callLog.campaigns
            },
            hasRecording: true
        })
    } catch (e) {
        console.error('recording GET error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
