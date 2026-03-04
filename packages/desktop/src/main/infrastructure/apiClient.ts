import { loadSession } from './sessionStore'

const BASE_URL = process.env.OCKHAM_API_URL || 'http://localhost:7353'

/**
 * Make a tRPC query (GET) to the Web backend.
 */
export async function trpcQuery<T = unknown>(path: string, input: unknown, tokenOverride?: string): Promise<T> {
    const session = loadSession()
    const token = tokenOverride || session?.token
    const encodedInput = encodeURIComponent(JSON.stringify({ json: input }))
    const url = `${BASE_URL}/api/trpc/${path}?input=${encodedInput}`

    const res = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(token),
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`tRPC query ${path} failed (${res.status}): ${text}`)
    }

    const body = await res.json() as { result?: { data?: { json?: T } } }
    return body.result?.data?.json as T
}

/**
 * Make a tRPC mutation (POST) to the Web backend.
 */
export async function trpcMutation<T = unknown>(path: string, input: unknown, tokenOverride?: string): Promise<T> {
    const session = loadSession()
    const token = tokenOverride || session?.token
    const url = `${BASE_URL}/api/trpc/${path}`

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': BASE_URL,
            ...buildHeaders(token),
        },
        body: JSON.stringify({ json: input }),
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`tRPC mutation ${path} failed (${res.status}): ${text}`)
    }

    const body = await res.json() as { result?: { data?: { json?: T } } }
    return body.result?.data?.json as T
}

/**
 * Build auth headers with session cookie.
 */
function buildHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {}
    if (token) {
        headers['cookie'] = `better-auth.session_token=${token}`
    }
    return headers
}

/**
 * Extract full signed session cookie from set-cookie headers.
 * better-auth cookie format: `better-auth.session_token=<token>.<signature>`
 */
function extractSessionCookie(res: Response): string | null {
    const setCookie = res.headers.getSetCookie?.() || []
    for (const cookie of setCookie) {
        const match = cookie.match(/better-auth\.session_token=([^;]+)/)
        if (match) {
            return decodeURIComponent(match[1])
        }
    }
    return null
}

/**
 * Login to the Web backend and return the session token.
 * better-auth uses signed cookies: the set-cookie value is `token.signature`
 * which is required for session validation. We extract that full value.
 */
export async function apiLogin(email: string, password: string): Promise<{
    token: string
    user: { id: string; name: string; email: string }
}> {
    const url = `${BASE_URL}/api/auth/sign-in/email`

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL },
        body: JSON.stringify({ email, password }),
    })

    const body = await res.json().catch(() => null) as {
        session?: { token?: string }
        token?: string
        user?: { id: string; name: string; email: string }
        message?: string
        error?: { message?: string }
    } | null

    if (!res.ok) {
        const msg = body?.message || body?.error?.message || `Login failed (${res.status})`
        throw new Error(msg)
    }

    // Extract full signed cookie token from set-cookie header (preferred)
    const cookieToken = extractSessionCookie(res)

    // Use cookie token (signed, works with getSession) or fall back to body token
    const token = cookieToken || body?.session?.token || body?.token
    const user = body?.user

    if (token && user) {
        return { token, user }
    }

    if (!token) {
        throw new Error('Login succeeded but no session token was returned')
    }

    // Fetch user info with the token
    const sessionRes = await fetch(`${BASE_URL}/api/auth/get-session`, {
        headers: buildHeaders(token),
    })
    const sessionData = await sessionRes.json() as { user?: { id: string; name: string; email: string } }

    if (!sessionData.user) {
        throw new Error('Failed to fetch user info after login')
    }

    return { token, user: sessionData.user }
}

/**
 * Register a new account on the Web backend, then auto-login.
 */
export async function apiRegister(email: string, password: string): Promise<{
    token: string
    user: { id: string; name: string; email: string }
}> {
    const url = `${BASE_URL}/api/auth/sign-up/email`
    const name = email.split('@')[0]

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL },
        body: JSON.stringify({ name, email, password }),
    })

    const body = await res.json().catch(() => null) as {
        session?: { token?: string }
        token?: string
        user?: { id: string; name: string; email: string }
        message?: string
        error?: { message?: string }
    } | null

    if (!res.ok) {
        const msg = body?.message || body?.error?.message || `Registration failed (${res.status})`
        throw new Error(msg)
    }

    // Extract full signed cookie token from set-cookie header (preferred)
    const cookieToken = extractSessionCookie(res)
    const token = cookieToken || body?.session?.token || body?.token
    const user = body?.user

    if (token && user) {
        return { token, user }
    }

    if (!token) {
        throw new Error('Registration succeeded but no session token was returned')
    }

    // Fetch user info with the token
    const sessionRes = await fetch(`${BASE_URL}/api/auth/get-session`, {
        headers: buildHeaders(token),
    })
    const sessionData = await sessionRes.json() as { user?: { id: string; name: string; email: string } }

    if (!sessionData.user) {
        throw new Error('Failed to fetch user info after registration')
    }

    return { token, user: sessionData.user }
}

