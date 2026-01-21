import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { normalizeLead } from '@/lib/lead-normalization'

export async function POST(req) {
    try {
        const body = await req.json()
        const { source, data, secret, map_project_id } = body

        // 1. Security Check (Basic Secret for Webhooks)
        const EXPECTED_SECRET = process.env.INGESTION_SECRET || 'vantage-secret-key';
        if (secret !== EXPECTED_SECRET) {
            // Check if authenticated user session exists (for internal CSV upload)
            const supabase = await createServerSupabaseClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
        }

        const supabase = await createServerSupabaseClient()

        // 2. Normalize Data
        if (!data) {
            return NextResponse.json({ error: 'No data provided' }, { status: 400 })
        }

        // Handle Array (Bulk) or Single Object
        const items = Array.isArray(data) ? data : [data];
        const processedLeads = [];
        const errors = [];

        for (const item of items) {
            try {
                // If map_project_id provided in body, override the item's project
                if (map_project_id) {
                    item.project_id = map_project_id;
                }

                const standardized = normalizeLead(source, item);

                if (!standardized.phone) {
                    errors.push({ item, error: 'Missing Phone Number' });
                    continue;
                }

                // 3. Upsert into DB
                // We match on (phone, project_id) ideally, or just phone if global.
                // For now, let's assume we want to insert. 
                // Using Upsert to avoid duplicates.

                const { data: inserted, error } = await supabase
                    .from('leads')
                    .upsert({
                        name: standardized.name,
                        phone: standardized.phone,
                        email: standardized.email,
                        project_id: standardized.project_id, // Must be valid UUID
                        lead_source: standardized.lead_source,
                        external_lead_id: standardized.external_lead_id,
                        raw_data: standardized.raw_data,
                        status: 'new' // Default status
                    }, { onConflict: 'phone, project_id' }) // Requires unique constraint
                    .select()
                    .single();

                if (error) throw error;
                processedLeads.push(inserted);

            } catch (err) {
                console.error("Ingest Error for item:", err);
                errors.push({ item, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedLeads.length,
            failed: errors.length,
            errors: errors.length > 0 ? errors : undefined
        })

    } catch (error) {
        console.error('Ingestion Fatal Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
