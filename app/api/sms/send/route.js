import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request) {
    const supabase = await createServerSupabaseClient();
    const { leadId, message, campaignId } = await request.json();

    if (!leadId) {
        return Response.json({ error: 'Lead ID required' }, { status: 400 });
    }

    // Get lead details
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('phone, name, organization_id')
        .eq('id', leadId)
        .single();

    if (leadError || !lead) {
        return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get organization for Plivo credentials
    const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', lead.organization_id)
        .single();

    // Use Plivo to send SMS
    const plivo = require('plivo');
    const client = new plivo.Client(
        process.env.PLIVO_AUTH_ID,
        process.env.PLIVO_AUTH_TOKEN
    );

    try {
        // Default message for Indian audience
        const smsMessage = message ||
            `नमस्ते ${lead.name}, हमने आपको कॉल करने की कोशिश की। कृपया हमें वापस कॉल करें या हाँ लिखकर भेजें। - ${org?.settings?.company_name || 'Real Estate Team'}`;

        const response = await client.messages.create(
            process.env.PLIVO_PHONE_NUMBER, // From
            lead.phone, // To
            smsMessage
        );

        console.log('✅ SMS sent:', response);

        // Log SMS attempt
        await supabase.from('call_attempts').insert({
            organization_id: lead.organization_id,
            lead_id: leadId,
            campaign_id: campaignId,
            attempt_number: 1, // Will be updated by retry logic
            channel: 'sms',
            outcome: 'sent',
            attempted_at: new Date().toISOString(),
            metadata: {
                message_uuid: response.messageUuid,
                message: smsMessage
            }
        });

        // Update lead
        await supabase
            .from('leads')
            .update({
                last_contacted_at: new Date().toISOString(),
                notes: `SMS sent: ${smsMessage.substring(0, 50)}...`
            })
            .eq('id', leadId);

        return Response.json({
            success: true,
            messageUuid: response.messageUuid
        });
    } catch (error) {
        console.error('❌ SMS error:', error);

        // Log failed attempt
        await supabase.from('call_attempts').insert({
            organization_id: lead.organization_id,
            lead_id: leadId,
            campaign_id: campaignId,
            channel: 'sms',
            outcome: 'failed',
            attempted_at: new Date().toISOString(),
            metadata: { error: error.message }
        });

        return Response.json({
            error: 'Failed to send SMS',
            details: error.message
        }, { status: 500 });
    }
}
