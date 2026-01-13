import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  organizationProfileSchema,
  organizationProfileDraftSchema
} from '@/lib/validation'
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  DatabaseError,
  handleApiError,
  logError
} from '@/lib/errors'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

/* =========================
   GET organization profile
========================= */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError()
    }

    const admin = createAdminClient()

    // Get user's organization using ADMIN client to bypass RLS
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      // Check for specific error codes
      if (profileError.code === '42P01') {
        throw new DatabaseError('Database setup incomplete: "profiles" table is missing.', profileError)
      }
      throw new DatabaseError(`Failed to fetch user profile: ${profileError.message}`, profileError)
    }

    // If user doesn't have an organization yet (during onboarding), return empty profile
    if (!profile?.organization_id) {
      return handleCORS(
        NextResponse.json({
          profile: {},
          organization_id: null,
          needsOnboarding: true
        })
      )
    }

    const { data: orgProfile, error: orgProfileError } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .single()

    // It's OK if no profile exists yet (user hasn't completed onboarding)
    if (orgProfileError && orgProfileError.code !== 'PGRST116') {
      console.error('Error fetching org profile:', orgProfileError)
    }

    return handleCORS(
      NextResponse.json({
        profile: orgProfile || {},
        organization_id: profile.organization_id
      })
    )
  } catch (error) {
    logError(error, { endpoint: 'GET /api/organization/profile' })
    const { status, body } = handleApiError(error)
    return handleCORS(NextResponse.json(body, { status }))
  }
}

/* =========================
   UPDATE organization profile (ONBOARDING)
========================= */
export async function PUT(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const admin = createAdminClient()

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('Authentication failed: No user found')
      throw new AuthenticationError()
    }
    console.log('User authenticated:', user.id)

    // Parse and validate request body
    const body = await request.json()

    // Use appropriate schema based on whether this is a complete submission
    const schema = body.isComplete
      ? organizationProfileSchema
      : organizationProfileDraftSchema

    const validatedData = schema.safeParse(body)

    if (!validatedData.success) {
      const errors = validatedData.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      throw new ValidationError('Validation failed', errors)
    }

    // Get user's organization
    // Get user's organization using ADMIN client to bypass RLS
    // This fixes "Failed to fetch user profile" if RLS policies are missing/incorrect
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('CRITICAL: Profile fetch failed:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      })

      // Check for specific error codes
      if (profileError.code === '42P01') {
        throw new DatabaseError('Database setup incomplete: "profiles" table is missing. Please run migration 004.', profileError)
      }

      throw new DatabaseError(`Failed to fetch user profile (${profileError.code}): ${profileError.message}`, profileError)
    }
    console.log('User profile fetched (admin), existing org ID:', profile?.organization_id)

    // If no organization_id in profile, try to find or create the organization
    let organizationId = profile?.organization_id

    if (!organizationId) {
      // Try to find any existing organization (since created_by doesn't exist in schema)
      let { data: userOrg } = await admin
        .from('organizations')
        .select('id, name')
        .limit(1)
        .maybeSingle()

      // If no organization exists, create one
      if (!userOrg) {
        const { data: newOrg, error: createOrgError } = await admin
          .from('organizations')
          .insert({
            name: validatedData.data.companyName || 'My Organization',
            onboarding_status: 'PENDING'
            // Note: created_by field doesn't exist in organizations table
          })
          .select('id, name')
          .single()

        if (createOrgError) {
          console.error('Organization creation error details:', createOrgError)
          throw new DatabaseError('Failed to create organization', createOrgError)
        }
        console.log('New organization created:', newOrg)

        userOrg = newOrg
      }

      if (userOrg?.id) {
        organizationId = userOrg.id

        // Update profile with organization_id and optionally set default role
        try {
          const { data: defaultRole } = await admin
            .from('roles')
            .select('id')
            .eq('name', 'Client Super Admin')
            .maybeSingle()

          await admin
            .from('profiles')
            .update({
              organization_id: organizationId,
              role_id: defaultRole?.id || null,
              full_name: validatedData.data.companyName || user.email.split('@')[0]
            })
            .eq('id', user.id)
        } catch (roleError) {
          // If role assignment fails, just update organization_id
          console.error('Role assignment failed, continuing without role:', roleError)
          await admin
            .from('profiles')
            .update({
              organization_id: organizationId,
              full_name: validatedData.data.companyName || user.email.split('@')[0]
            })
            .eq('id', user.id)
        }
      } else {
        console.error('Failed to setup organization: No ID returned')
        throw new AuthorizationError('Failed to setup organization. Please contact support.')
      }
    }

    // Prepare data for upsert (convert camelCase to snake_case)
    const profileData = {
      organization_id: organizationId,
      sector: validatedData.data.sector,
      business_type: validatedData.data.businessType,
      company_name: validatedData.data.companyName,
      gstin: validatedData.data.gstin || null,
      contact_number: validatedData.data.contactNumber,
      address_line_1: validatedData.data.addressLine1,
      address_line_2: validatedData.data.addressLine2 || null,
      city: validatedData.data.city,
      state: validatedData.data.state,
      country: validatedData.data.country || 'India',
      pincode: validatedData.data.pincode,
      updated_at: new Date().toISOString()
    }

    // Upsert organization profile
    const { error: upsertError } = await admin
      .from('organization_profiles')
      .upsert(profileData, { onConflict: 'organization_id' })

    if (upsertError) {
      console.error('Organization profile upsert failed:', upsertError)
      throw new DatabaseError('Failed to save organization profile', upsertError)
    }
    console.log('Organization profile upserted successfully')

    // If this is the final submission, mark onboarding as complete
    if (body.isComplete) {
      const { error: orgUpdateError } = await admin
        .from('organizations')
        .update({
          onboarding_status: 'COMPLETED',
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId)

      if (orgUpdateError) {
        throw new DatabaseError('Failed to update organization status', orgUpdateError)
      }

      // Create audit log
      const { error: auditError } = await admin
        .from('audit_logs')
        .insert({
          user_id: user.id,
          user_name: user.email,
          action: 'ONBOARDING_COMPLETED',
          entity_type: 'organization',
          entity_id: organizationId,
          organization_id: organizationId,
          metadata: { company_name: validatedData.data.companyName }
        })

      if (auditError) {
        console.error('Failed to create audit log:', auditError)
        // Don't throw - audit log failure shouldn't block onboarding
      } else {
        console.log('Audit log created successfully')
      }
    }

    return handleCORS(
      NextResponse.json({
        message: body.isComplete
          ? 'Onboarding completed successfully'
          : 'Profile saved as draft',
        completed: !!body.isComplete
      })
    )
  } catch (error) {
    console.error('CRITICAL ERROR in PUT /api/organization/profile:', error)
    // Log detailed error info if available
    if (error.details) console.error('Error details:', error.details)
    if (error.hint) console.error('Error hint:', error.hint)
    if (error.code) console.error('Error code:', error.code)

    logError(error, {
      endpoint: 'PUT /api/organization/profile',
      body: request.body
    })
    const { status, body } = handleApiError(error)
    return handleCORS(NextResponse.json(body, { status }))
  }
}

/* =========================
   OPTIONS for CORS
========================= */
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}
