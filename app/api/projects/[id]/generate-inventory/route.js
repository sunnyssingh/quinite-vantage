import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsJSON } from '@/lib/cors'

export const dynamic = 'force-dynamic'

export async function POST(req, { params }) {
    try {
        const { id: projectId } = await params
        const {
            configurations,
            namingPattern, // e.g., "{block}-{floor}{unit}" (not used yet, logical placeholder)
            blockName,
            startFloor,
            endFloor,
            unitsPerFloor,
            unitType // e.g., "3BHK"
        } = await req.json()

        if (!projectId || !blockName || !unitType) {
            return corsJSON({ error: 'Missing required fields' }, { status: 400 })
        }

        const adminClient = createAdminClient()

        // Fetch project details including total_units
        const { data: projectData, error: projectError } = await adminClient
            .from('projects')
            .select('organization_id, total_units')
            .eq('id', projectId)
            .single()

        if (projectError || !projectData) {
            return corsJSON({ error: 'Project not found' }, { status: 404 })
        }

        // Get current unit count
        const { count: currentUnitCount, error: countError } = await adminClient
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)

        if (countError) {
            console.error('Error fetching unit count:', countError)
            return corsJSON({ error: 'Failed to validate unit limits' }, { status: 500 })
        }

        const newProperties = []

        // Calculate total new units to be generated
        const startF = parseInt(startFloor || 1)
        const endF = parseInt(endFloor || 1)
        const unitsPerF = parseInt(unitsPerFloor || 1)
        const totalNewUnits = (endF - startF + 1) * unitsPerF

        if (currentUnitCount + totalNewUnits > (projectData.total_units || 0)) {
            return corsJSON({
                error: `Cannot generate ${totalNewUnits} units. Project limit is ${projectData.total_units} units, and you already have ${currentUnitCount}.`
            }, { status: 400 })
        }

        // Logic: specific block generation
        // Loop through floors
        for (let f = parseInt(startFloor || 1); f <= parseInt(endFloor || 1); f++) {
            // Loop through units per floor
            for (let u = 1; u <= parseInt(unitsPerFloor || 1); u++) {
                // Pad unit number if needed (e.g. 1 -> 01)
                const unitNumStr = u.toString().padStart(2, '0')
                const propertyTitle = `${blockName} - ${f}${unitNumStr}`

                // Find config details if available (price, size, etc.)
                // Assuming 'configurations' array passed from frontend has details
                const configDetails = configurations?.find(c => c.configuration === unitType) || {}

                newProperties.push({
                    organization_id: projectData.organization_id,
                    project_id: projectId,
                    title: propertyTitle,
                    block_name: blockName,
                    floor_number: f.toString(),
                    unit_number: `${f}${unitNumStr}`,
                    configuration: unitType,
                    type: configDetails.property_type || 'Apartment',
                    status: 'available',
                    price: configDetails.price || 0,
                    size_sqft: configDetails.carpet_area || 0,
                    bedrooms: unitType.match(/\d+/)?.[0] || null, // Extract "3" from "3BHK"
                    bathrooms: (unitType.match(/\d+/)?.[0] || 1), // Default logic
                    description: `Auto-generated unit ${propertyTitle} in ${blockName}`,
                    show_in_crm: true
                })
            }
        }

        if (newProperties.length === 0) {
            return corsJSON({ error: 'No properties generated. Check parameters.' }, { status: 400 })
        }

        const { data, error } = await adminClient
            .from('properties')
            .insert(newProperties)
            .select()

        if (error) {
            console.error('Bulk create error:', error)
            return corsJSON({ error: error.message }, { status: 500 })
        }

        // Update Project Totals (Available Units)
        // This is complex because we need to count *all* units. 
        // For now, let's just return success and let the frontend refresh.

        return corsJSON({
            success: true,
            count: data.length,
            message: `Successfully created ${data.length} units in Block ${blockName}`
        })

    } catch (e) {
        console.error('Generate inventory error:', e)
        return corsJSON({ error: e.message }, { status: 500 })
    }
}
