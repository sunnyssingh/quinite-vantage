import { NextResponse } from 'next/server'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function GET() {
  return handleCORS(NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() }))
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 204 }))
}
