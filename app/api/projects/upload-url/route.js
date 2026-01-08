import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 204 }))
}

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient()

    // 🔐 Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return handleCORS(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    }

    const { fileName, contentType } = await request.json()
    if (!fileName || !contentType) {
      return handleCORS(
        NextResponse.json(
          { error: 'fileName and contentType required' },
          { status: 400 }
        )
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return handleCORS(
        NextResponse.json({ error: 'Organization not found' }, { status: 400 })
      )
    }

    const ext = fileName.split('.').pop()
    const imagePath = `projects/${profile.organization_id}/${crypto.randomUUID()}.${ext}`

    const { data, error } = await supabase.storage
      .from('project-images')
      .createSignedUploadUrl(imagePath)

    if (error) {
      return handleCORS(
        NextResponse.json({ error: error.message }, { status: 500 })
      )
    }

    const { data: publicUrl } = supabase.storage
      .from('project-images')
      .getPublicUrl(imagePath)

    return handleCORS(
      NextResponse.json({
        uploadUrl: data.signedUrl,
        image_url: publicUrl.publicUrl,
        image_path: imagePath
      })
    )
  } catch (err) {
    console.error('UPLOAD URL ERROR:', err)
    return handleCORS(
      NextResponse.json({ error: 'Server error' }, { status: 500 })
    )
  }
}
