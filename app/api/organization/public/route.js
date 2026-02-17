import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export const dynamic = 'force-dynamic'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const slug = searchParams.get('slug')
        const domain = searchParams.get('domain')

        if (!slug && !domain) {
            return corsJSON({ error: 'Slug or domain is required' }, { status: 400 })
        }

        const admin = createAdminClient()
        let query = admin.from('organizations').select('id, name, slug, custom_domain, website_config, public_profile_enabled, settings, logo_url, address_line_1, address_line_2, city, state, pincode, country, contact_number, email')
            .eq('public_profile_enabled', true) // Only active profiles

        if (slug) {
            query = query.eq('slug', slug)
        } else if (domain) {
            query = query.eq('custom_domain', domain)
        }

        const { data: org, error } = await query.single()

        if (error || !org) {
            return corsJSON({ error: 'Organization not found or profile not public' }, { status: 404 })
        }

        // Return only necessary public data
        const publicProfile = {
            id: org.id,
            name: org.name,
            slug: org.slug,
            config: org.website_config,
            logo: org.settings?.logo_url || org.logo_url, // Fallback
            contact: {
                address: {
                    line1: org.address_line_1,
                    line2: org.address_line_2,
                    city: org.city,
                    state: org.state,
                    pincode: org.pincode,
                    country: org.country
                },
                phone: org.contact_number,
                email: org.email
            }
        }

        return corsJSON({ organization: publicProfile })

    } catch (e) {
        console.error('Public org fetch error:', e)
        return corsJSON({ error: 'Internal Server Error' }, { status: 500 })
    }
}
