import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/permissions'
import { corsJSON } from '@/lib/cors'
import Ajv from 'ajv'
import fs from 'fs'
import path from 'path'

import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return corsJSON({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return corsJSON({ error: 'Organization not found' }, { status: 400 })
    }

    // Projects can be fetched with standard client if policies allow
    // But if RLS is strict for projects, use admin or ensure policies exist
    // Assuming projects table RLS allows organization access
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return corsJSON({ projects: data || [] })
  } catch (e) {
    console.error('projects GET error:', e)
    return corsJSON({ error: e.message }, { status: 500 })
  }
}


export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return corsJSON({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('organization_id, full_name')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return corsJSON({ error: 'Organization not found' }, { status: 400 })
    }

    const {
      name,
      description,
      address,
      type,
      metadata,
      image_url,
      image_path
    } = body

    // Validate optional real estate payload if present
    const realEstate = body.real_estate || (metadata && metadata.real_estate)
    if (realEstate) {
      try {
        const schemaPath = path.join(process.cwd(), 'lib', 'schemas', 'realEstateProperty.schema.json')
        const schemaRaw = fs.readFileSync(schemaPath, 'utf8')
        const schema = JSON.parse(schemaRaw)
        const ajv = new Ajv({ allErrors: true, strict: false })
        const validate = ajv.compile(schema)
        const valid = validate(realEstate)
        if (!valid) {
          return corsJSON({
            error: 'Invalid real_estate payload',
            details: validate.errors
          }, { status: 400 })
        }
      } catch (err) {
        console.error('Schema validation error:', err)
        return corsJSON({ error: 'Schema validation failed' }, { status: 500 })
      }
    }

    if (!name) {
      return corsJSON({ error: 'Project name is required' }, { status: 400 })
    }

    const payload = {
      name,
      description: description || null,
      address: address || null,
      project_type: type || null,
      metadata: metadata || (realEstate ? { real_estate: realEstate } : null),
      image_url: image_url || null,
      image_path: image_path || null,
      organization_id: profile.organization_id,
      created_by: user.id
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    try {
      await logAudit(
        supabase,
        user.id,
        profile.full_name || user.email,
        'project.create',
        'project',
        project.id,
        { name: project.name }
      )
    } catch (e) {
      console.warn('Audit log failed:', e.message)
    }

    return corsJSON({ project })
  } catch (e) {
    console.error('projects POST error:', e)
    return corsJSON({ error: e.message }, { status: 500 })
  }
}
