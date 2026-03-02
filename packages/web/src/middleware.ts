import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js middleware to handle CORS for API routes.
 * Allows the Electron renderer (localhost:5173) to make direct HTTP calls.
 */
export function middleware(request: NextRequest) {
    // Handle CORS preflight (OPTIONS) requests
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: corsHeaders(),
        })
    }

    // Add CORS headers to all API responses
    const response = NextResponse.next()
    const headers = corsHeaders()
    for (const [key, value] of Object.entries(headers)) {
        response.headers.set(key, value)
    }
    return response
}

function corsHeaders(): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
        'Access-Control-Max-Age': '86400',
    }
}

// Only apply to API routes
export const config = {
    matcher: '/api/:path*',
}
