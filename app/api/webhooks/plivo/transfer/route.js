
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
                // 2. Find 'Employee' Role ID
                const { data: role } = await supabase
                    .from('roles')
                    .select('id')
                    .eq('name', 'Employee')
                    .single();

                if (role?.id) {
                    // 3. Find an Employee Profile in this Org with a Phone Number
                    const { data: employee } = await supabase
                        .from('profiles')
                        .select('phone, full_name')
                        .eq('organization_id', campaign.organization_id)
                        .eq('role_id', role.id)
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
