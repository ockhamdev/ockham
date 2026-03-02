/**
 * Direct API client for the renderer process.
 * Bypasses IPC and calls the Web backend directly using the auth token from localStorage.
 */

// In dev mode, Vite proxy forwards /api/* to localhost:7353, so we use relative paths.
// In production (file:// protocol), we need the full URL.
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:7353' : ''

function getToken(): string | undefined {
    return localStorage.getItem('ockham_auth_token') || undefined
}

function buildHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {}
    if (token) {
        headers['cookie'] = `better-auth.session_token=${token}`
    }
    return headers
}

async function trpcQuery<T = unknown>(path: string, input: unknown): Promise<T> {
    const token = getToken()
    const encodedInput = encodeURIComponent(JSON.stringify({ json: input }))
    const url = `${API_BASE}/api/trpc/${path}?input=${encodedInput}`

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

async function trpcMutation<T = unknown>(path: string, input: unknown): Promise<T> {
    const token = getToken()
    const url = `${API_BASE}/api/trpc/${path}`

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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

// ── Auth ──

export async function apiLogin(email: string, password: string): Promise<{
    token: string; userId: string; userName: string; email: string
}> {
    const res = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(body?.message || body?.error?.message || `Login failed (${res.status})`)
    }

    const token = body?.session?.token || body?.token
    const user = body?.user

    if (!token || !user) {
        throw new Error('Login succeeded but no session token or user data returned')
    }

    // Save token for future API calls
    localStorage.setItem('ockham_auth_token', token)
    localStorage.setItem('ockham_session', JSON.stringify({
        userId: user.id, userName: user.name, email: user.email,
    }))

    return { token, userId: user.id, userName: user.name, email: user.email }
}

export async function apiRegister(email: string, password: string): Promise<{
    token: string; userId: string; userName: string; email: string
}> {
    const name = email.split('@')[0]
    const res = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(body?.message || body?.error?.message || `Registration failed (${res.status})`)
    }

    const token = body?.session?.token || body?.token
    const user = body?.user

    if (!token || !user) {
        throw new Error('Registration succeeded but no session token or user data returned')
    }

    localStorage.setItem('ockham_auth_token', token)
    localStorage.setItem('ockham_session', JSON.stringify({
        userId: user.id, userName: user.name, email: user.email,
    }))

    return { token, userId: user.id, userName: user.name, email: user.email }
}

export function apiLogout(): void {
    localStorage.removeItem('ockham_auth_token')
    localStorage.removeItem('ockham_session')
    localStorage.removeItem('ockham_current_team')
    localStorage.removeItem('ockham_teams')
}

export function getStoredSession(): { userId: string; userName: string; email: string } | null {
    const cached = localStorage.getItem('ockham_session')
    if (!cached) return null
    try { return JSON.parse(cached) } catch { return null }
}

export function getStoredToken(): string | null {
    return localStorage.getItem('ockham_auth_token')
}

// ── Team ──

export interface Team {
    id: string
    name: string
    slug: string
}

export async function ensureTeam(): Promise<Team> {
    return trpcQuery<Team>('team.ensureTeam', undefined)
}

export async function listTeams(): Promise<Team[]> {
    return trpcQuery<Team[]>('team.list', undefined)
}

// ── Team AI Config ──

export interface TeamAiConfig {
    id: string
    teamId: string
    provider: string
    apiKey: string
    baseUrl?: string
    models: string[]
    isDefault: boolean
}

export async function listAiConfigs(teamId: string): Promise<TeamAiConfig[]> {
    return trpcQuery<TeamAiConfig[]>('teamAiConfig.list', { teamId })
}

export async function upsertAiConfig(data: {
    id?: string; teamId: string; provider: string; apiKey: string
    baseUrl?: string; models?: string[]; isDefault?: boolean
}): Promise<TeamAiConfig> {
    return trpcMutation<TeamAiConfig>('teamAiConfig.upsert', data)
}

export async function deleteAiConfig(id: string): Promise<void> {
    await trpcMutation('teamAiConfig.delete', { id })
}

// ── Create Team ──

export async function createTeam(name: string, slug: string): Promise<Team> {
    return trpcMutation<Team>('team.create', { name, slug })
}

// ── Knowledge Base ──

export interface KnowledgeEntry {
    id: string
    teamId: string
    title: string
    content: string
    createdBy: string
    updatedBy: string
    createdAt: string
    updatedAt: string
}

export async function listKnowledgeEntries(teamId: string): Promise<KnowledgeEntry[]> {
    return trpcQuery<KnowledgeEntry[]>('knowledgeEntry.list', { teamId })
}

export async function createKnowledgeEntry(data: {
    teamId: string; title: string; content?: string
}): Promise<KnowledgeEntry> {
    return trpcMutation<KnowledgeEntry>('knowledgeEntry.create', data)
}

export async function updateKnowledgeEntry(data: {
    id: string; title?: string; content?: string
}): Promise<KnowledgeEntry> {
    return trpcMutation<KnowledgeEntry>('knowledgeEntry.update', data)
}

export async function deleteKnowledgeEntry(id: string): Promise<void> {
    await trpcMutation('knowledgeEntry.delete', { id })
}
