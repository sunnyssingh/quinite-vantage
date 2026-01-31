// Run database migration to add avatar_url column to leads table
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Running migration: Add avatar_url to leads table...\n');

    const migrationSQL = `
        -- Add avatar_url column to leads table
        ALTER TABLE public.leads 
        ADD COLUMN IF NOT EXISTS avatar_url TEXT;

        -- Add comment for documentation
        COMMENT ON COLUMN public.leads.avatar_url IS 'URL to the lead''s profile avatar image (DiceBear SVG or uploaded image)';
    `;

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

        if (error) {
            // Try direct query instead
            const { error: directError } = await supabase
                .from('leads')
                .select('avatar_url')
                .limit(1);

            if (directError && directError.message.includes('avatar_url')) {
                // Column doesn't exist, need to run raw SQL
                console.log('⚠️  Cannot run migration via RPC. Please run the SQL manually in Supabase Dashboard.');
                console.log('\n📋 Copy this SQL and run it in Supabase Dashboard → SQL Editor:\n');
                console.log('─'.repeat(60));
                console.log(migrationSQL);
                console.log('─'.repeat(60));
                process.exit(1);
            } else {
                console.log('✅ Column already exists or migration completed!');
            }
        } else {
            console.log('✅ Migration completed successfully!');
        }

        // Verify the column exists
        console.log('\n🔍 Verifying column exists...');
        const { data: verifyData, error: verifyError } = await supabase
            .from('leads')
            .select('id, name, avatar_url')
            .limit(1);

        if (verifyError) {
            console.error('❌ Verification failed:', verifyError.message);
            console.log('\n📋 Please run this SQL manually in Supabase Dashboard → SQL Editor:\n');
            console.log('─'.repeat(60));
            console.log(migrationSQL);
            console.log('─'.repeat(60));
        } else {
            console.log('✅ Verification successful! Column exists and is accessible.');
            console.log('\n🎉 Migration complete! You can now use the avatar upload feature.');
        }

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.log('\n📋 Please run this SQL manually in Supabase Dashboard → SQL Editor:\n');
        console.log('─'.repeat(60));
        console.log(migrationSQL);
        console.log('─'.repeat(60));
    }
}

runMigration();
