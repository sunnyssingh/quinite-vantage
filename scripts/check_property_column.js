require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkColumn() {
    const { data, error } = await supabase
        .from('leads')
        .select('property_id')
        .limit(1);

    if (error) {
        console.log('Error (likely column missing):', error.message);
    } else {
        console.log('Success (column exists)! Data:', data);
    }
}

checkColumn();
