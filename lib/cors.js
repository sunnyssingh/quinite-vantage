import { NextResponse } from 'next/server'

/**
 * Centralized CORS handler for all API routes
 * Ensures consistent CORS headers across the application
 */
export function handleCORS(response) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleOPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}

/**
 * Create a JSON response with CORS headers
 */
export function corsJSON(data, options = {}) {
    const response = NextResponse.json(data, options)
    return handleCORS(response)
}
