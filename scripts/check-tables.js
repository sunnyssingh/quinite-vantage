require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
    const tables = ['projects', 'profiles', 'campaigns', 'call_logs', 'usage_logs'];

    console.log('Checking tables...');

    for (const table of tables) {
        // Try to select one row
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            console.error(`❌ Table '${table}' check failed:`, error.message);
        } else {
            console.log(`✅ Table '${table}' exists.`);
            // Check if organization_id exists in the returned row (if any) or if we can infer schema?
            // Supabase JS doesn't give schema directly easily without metadata query, 
            // but we can try selecting organization_id specifically.

            const { error: colError } = await supabase.from(table).select('organization_id').limit(1);
            if (colError) {
                console.error(`   ⚠️ Column 'organization_id' in '${table}' check failed:`, colError.message);
            } else {
                console.log(`   ✅ Column 'organization_id' detected in '${table}'.`);
            }
        }
    }
}

checkTables();
