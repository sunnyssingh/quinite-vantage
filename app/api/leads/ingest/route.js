import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { normalizeLead } from '@/lib/lead-normalization'

/**
 * Lead Ingestion API
 * Accepts leads from external sources (webhooks, CSV uploads, etc.)
 * 
 * @route POST /api/leads/ingest
 * @body {
 *   source: string (e.g., 'magicbricks', '99acres', 'facebook', 'csv'),
 *   data: object | array (lead data),
 *   secret: string (webhook secret for authentication),
 *   map_project_id: string (optional - override project ID for all leads)
 * }
 */
export async function POST(req) {
    try {
        // Parse request body
        let body
        try {
            body = await req.json()
        } catch (parseError) {
            return NextResponse.json({
                success: false,
                error: 'Invalid JSON',
                message: 'The request body must be valid JSON. Please check your payload format.',
                hint: 'Ensure your Content-Type header is set to application/json'
            }, { status: 400 })
        }

        const { source, data, secret, map_project_id } = body

        // Validate required fields
        if (!source) {
            return NextResponse.json({
                success: false,
                error: 'Missing Source',
                message: 'The "source" field is required to identify where the lead came from.',
                hint: 'Valid sources: magicbricks, 99acres, facebook, csv',
                example: { source: 'magicbricks', data: { ... } }
            }, { status: 400 })
        }

        if (!data) {
            return NextResponse.json({
                success: false,
                error: 'Missing Data',
                message: 'No lead data provided. Please include lead information in the "data" field.',
                hint: 'Data can be a single object or an array of objects',
                example: { source: 'magicbricks', data: { name: 'John Doe', phone: '9876543210' } }
            }, { status: 400 })
        }

        // Security Check - Webhook Secret or Authenticated Session
        const EXPECTED_SECRET = process.env.INGESTION_SECRET || 'vantage-secret-key'

        if (secret !== EXPECTED_SECRET) {
            // Check if user is authenticated (for internal CSV uploads)
            try {
                const supabase = await createServerSupabaseClient()
                const { data: { user }, error: authError } = await supabase.auth.getUser()

                if (authError || !user) {
                    return NextResponse.json({
                        success: false,
                        error: 'Unauthorized',
                        message: 'Authentication failed. Please provide a valid webhook secret or sign in.',
                        hint: 'Add "secret" parameter to your request or ensure you are logged in',
                        receivedSecret: secret ? '***' + secret.slice(-4) : 'none'
                    }, { status: 401 })
                }
            } catch (authCheckError) {
                return NextResponse.json({
                    success: false,
                    error: 'Authentication Error',
                    message: 'Unable to verify authentication. Please try again.',
                    details: process.env.NODE_ENV === 'development' ? authCheckError.message : undefined
                }, { status: 401 })
            }
        }

        const supabase = await createServerSupabaseClient()

        // Process leads (single or bulk)
        const items = Array.isArray(data) ? data : [data]
        const processedLeads = []
        const errors = []

        console.log(`📥 [Lead Ingest] Processing ${items.length} lead(s) from source: ${source}`)

        for (let i = 0; i < items.length; i++) {
            const item = items[i]

            try {
                // Override project ID if provided
                if (map_project_id) {
                    item.project_id = map_project_id
                }

                // Normalize lead data based on source
                const standardized = normalizeLead(source, item)

                // Validate required fields
                if (!standardized.phone) {
                    errors.push({
                        index: i,
                        item: item,
                        error: 'Missing Phone Number',
                        message: 'Phone number is required for all leads',
                        hint: 'Ensure your data includes a phone field (mobile, contact_details.mobile, etc.)'
                    })
                    continue
                }

                if (!standardized.project_id) {
                    errors.push({
                        index: i,
                        item: item,
                        error: 'Missing Project ID',
                        message: 'Could not determine which project this lead belongs to',
                        hint: 'Either include project_id in the lead data or provide map_project_id in the request body'
                    })
                    continue
                }

                // Upsert lead into database
                const { data: inserted, error: dbError } = await supabase
                    .from('leads')
                    .upsert({
                        name: standardized.name || 'Unknown',
                        phone: standardized.phone,
                        email: standardized.email,
                        project_id: standardized.project_id,
                        lead_source: standardized.lead_source || source,
                        external_lead_id: standardized.external_lead_id,
                        raw_data: standardized.raw_data || item,
                        status: 'new'
                    }, { onConflict: 'phone, project_id' })
                    .select()
                    .single()

                if (dbError) {
                    // Handle specific database errors
                    if (dbError.code === '23503') {
                        errors.push({
                            index: i,
                            item: item,
                            error: 'Invalid Project ID',
                            message: `Project ID "${standardized.project_id}" does not exist`,
                            hint: 'Verify the project_id exists in your database'
                        })
                    } else if (dbError.code === '23505') {
                        // Duplicate - this is actually OK for upsert, but log it
                        console.log(`ℹ️  [Lead Ingest] Duplicate lead updated: ${standardized.phone}`)
                        processedLeads.push({ phone: standardized.phone, status: 'updated' })
                    } else {
                        throw dbError
                    }
                } else {
                    processedLeads.push(inserted)
                    console.log(`✅ [Lead Ingest] Lead processed: ${inserted.name} (${inserted.phone})`)
                }

            } catch (itemError) {
                console.error(`❌ [Lead Ingest] Error processing lead ${i}:`, itemError)
                errors.push({
                    index: i,
                    item: item,
                    error: 'Processing Failed',
                    message: itemError.message || 'An unexpected error occurred while processing this lead',
                    details: process.env.NODE_ENV === 'development' ? itemError.stack : undefined
                })
            }
        }

        // Return comprehensive response
        const response = {
            success: processedLeads.length > 0,
            summary: {
                total: items.length,
                processed: processedLeads.length,
                failed: errors.length
            },
            leads: processedLeads.length > 0 ? processedLeads : undefined,
            errors: errors.length > 0 ? errors : undefined,
            message: errors.length === 0
                ? `Successfully processed ${processedLeads.length} lead(s)`
                : `Processed ${processedLeads.length} lead(s), ${errors.length} failed`
        }

        const statusCode = errors.length === items.length ? 400 : 200

        console.log(`📊 [Lead Ingest] Complete: ${processedLeads.length} success, ${errors.length} failed`)

        return NextResponse.json(response, { status: statusCode })

    } catch (error) {
        console.error('💥 [Lead Ingest] Fatal Error:', error)

        return NextResponse.json({
            success: false,
            error: 'Internal Server Error',
            message: 'An unexpected error occurred while processing your request',
            hint: 'Please contact support if this issue persists',
            details: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack
            } : undefined
        }, { status: 500 })
    }
}
