
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request) {
    console.log('🔄 Plivo Transfer Webhook Hit');
    const { searchParams } = new URL(request.url);
    const defaultToNumber = searchParams.get('to');
    const leadId = searchParams.get('leadId');
    const campaignId = searchParams.get('campaignId');

    let transferToNumber = defaultToNumber;
    const supabase = createAdminClient();

    try {
        if (campaignId) {
            console.log(`🔍 Looking for available employee for Campaign: ${campaignId}`);

            // 1. Get Organization ID from Campaign
            const { data: campaign, error: campError } = await supabase
                .from('campaigns')
                .select('organization_id')
                .eq('id', campaignId)
                .single();

            if (campaign?.organization_id) {
                // 2. Find an Employee Profile in this Org with a Phone Number
                // User uses 'role' enum in profiles table, not a separate roles table
                const { data: employee } = await supabase
                    .from('profiles')
                    .select('phone, full_name')
                    .eq('organization_id', campaign.organization_id)
                    .eq('role', 'employee')
                    .not('phone', 'is', null) // Must have phone
                    .limit(1)
                    .maybeSingle();

                if (employee?.phone) {
                    console.log(`✅ Found available employee: ${employee.full_name} (${employee.phone})`);
                    transferToNumber = employee.phone;
                } else {
                    console.log('⚠️ No employees with phone numbers found in this organization.');
                }
            }
        }
    } catch (error) {
        console.error('❌ Error finding dynamic employee:', error);
    }

    if (!transferToNumber) {
        console.error('❌ Missing transfer number (Default & Dynamic both failed)');
        return new NextResponse('<Response><Hangup/></Response>', {
            headers: { 'Content-Type': 'text/xml' }
        });
    }

    console.log(`📞 Final Transfer Target: ${transferToNumber}`);

    // Update call_logs to mark as transferred
    if (leadId && campaignId) {
        await supabase
            .from('call_logs')
            .update({ call_status: 'transferred' })
            .eq('lead_id', leadId)
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false })
            .limit(1)
            .select()

        // Update lead status (Legacy columns removed)
        // Ideally we should move them to a "Qualified" stage here, but for now we just track it.
        // TODO: Look up 'Qualified' stage and move them there.
        await supabase
            .from('leads')
            .update({
                transferred_to_human: true,
                last_contacted_at: new Date().toISOString()
            })
            .eq('id', leadId)
    }

    // Generate Plivo XML for blind transfer
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Speak>Connecting you to a specialist now. Please hold.</Speak>
    <Dial callerId="${process.env.PLIVO_PHONE_NUMBER || ''}">
        <Number>${transferToNumber}</Number>
    </Dial>
</Response>`;

    return new NextResponse(xml, {
        headers: { 'Content-Type': 'text/xml' }
    });
}
