
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLeadData() {
    const leadId = '72612392-dd5e-445a-b1e9-4ca1f4a14da1';
    console.log(`Checking data for lead: ${leadId}`);

    // Check Call Logs
    const { data: callLogs, error: callError } = await supabase
        .from('call_logs')
        .select('id, status, campaign_id')
        .eq('lead_id', leadId);

    if (callError) {
        console.error('Error fetching call logs:', callError);
    } else {
        console.log(`Found ${callLogs.length} call logs:`, callLogs);
    }

    // Check if lead exists
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('id, name, project_id')
        .eq('id', leadId)
        .single();

    if (leadError) {
        console.error('Error fetching lead:', leadError);
    } else {
        console.log('Lead found:', lead);
    }
}

checkLeadData();
