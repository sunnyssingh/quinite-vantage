import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: 'Missing Supabase credentials' },
                { status: 500 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Run the migration SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE public.leads 
                ADD COLUMN IF NOT EXISTS avatar_url TEXT;
                
                COMMENT ON COLUMN public.leads.avatar_url IS 'URL to the lead profile avatar image';
            `
        })

        if (error) {
            console.error('Migration error:', error)
            return NextResponse.json(
                {
                    error: error.message,
                    suggestion: 'Please run the SQL manually in Supabase Dashboard → SQL Editor',
                    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS avatar_url TEXT;`
                },
                { status: 500 }
            )
        }

        // Verify the column exists
        const { error: verifyError } = await supabase
            .from('leads')
            .select('avatar_url')
            .limit(1)

        if (verifyError) {
            return NextResponse.json(
                {
                    error: 'Column verification failed',
                    details: verifyError.message
                },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Migration completed successfully! avatar_url column added to leads table.'
        })

    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}
