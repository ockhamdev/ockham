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

/**
 * Extract full signed session cookie from set-cookie headers.
 * In same-origin (Vite proxy), getSetCookie() returns the signed cookie.
 * In cross-origin (production file://), it may not be available.
 */
function extractSessionCookie(res: Response): string | null {
    try {
        const setCookie = res.headers.getSetCookie?.() || []
        for (const cookie of setCookie) {
            const match = cookie.match(/better-auth\.session_token=([^;]+)/)
            if (match) {
                return decodeURIComponent(match[1])
            }
        }
    } catch {
        // getSetCookie may not be available in all environments
    }
    return null
}

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

    // Prefer full signed cookie from set-cookie header, fall back to body token
    const token = extractSessionCookie(res) || body?.session?.token || body?.token
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

    // Prefer full signed cookie from set-cookie header, fall back to body token
    const token = extractSessionCookie(res) || body?.session?.token || body?.token
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

// ── Project ──

export interface Project {
    id: string
    teamId: string
    name: string
    slug: string
    description: string
}

export async function ensureProject(teamId: string, slug: string, name: string): Promise<Project> {
    return trpcMutation<Project>('project.ensureBySlug', { teamId, slug, name })
}

export async function listProjects(teamId: string): Promise<Project[]> {
    return trpcQuery<Project[]>('project.list', { teamId })
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

// ── Notes ──

export interface NoteRecord {
    id: string; projectId: string; title: string; content: string
    createdAt: string; updatedAt: string
}

export async function listNotes(projectId: string): Promise<NoteRecord[]> {
    return trpcQuery<NoteRecord[]>('note.list', { projectId })
}

export async function createNote(data: { projectId: string; title: string; content: string }): Promise<NoteRecord> {
    return trpcMutation<NoteRecord>('note.create', data)
}

export async function updateNote(data: { id: string; title?: string; content?: string }): Promise<NoteRecord> {
    return trpcMutation<NoteRecord>('note.update', data)
}

export async function deleteNote(id: string): Promise<void> {
    await trpcMutation('note.delete', { id })
}

// ── Issues ──

export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical'

export interface Issue {
    id: string
    projectId: string
    title: string
    description: string
    status: IssueStatus
    priority: IssuePriority
    assigneeId: string | null
    createdBy: string
    createdAt: string
    updatedAt: string
}

export async function listIssues(projectId: string): Promise<Issue[]> {
    return trpcQuery<Issue[]>('issue.list', { projectId })
}

export async function createIssue(data: {
    projectId: string; title: string; description?: string; priority?: IssuePriority
}): Promise<Issue> {
    return trpcMutation<Issue>('issue.create', data)
}

export async function updateIssue(data: {
    id: string; title?: string; description?: string
    priority?: IssuePriority; assigneeId?: string | null
}): Promise<Issue> {
    return trpcMutation<Issue>('issue.update', data)
}

export async function transitionIssue(id: string, action: 'start' | 'resolve' | 'close' | 'reopen'): Promise<Issue> {
    return trpcMutation<Issue>('issue.transition', { id, action })
}

export async function deleteIssue(id: string): Promise<void> {
    await trpcMutation('issue.delete', { id })
}

// ── Project Knowledge ──

export interface ProjectKnowledgeEntry {
    id: string
    projectId: string
    title: string
    content: string
    createdBy: string
    updatedBy: string
    createdAt: string
    updatedAt: string
}

export async function listProjectKnowledge(projectId: string): Promise<ProjectKnowledgeEntry[]> {
    return trpcQuery<ProjectKnowledgeEntry[]>('projectKnowledge.list', { projectId })
}

export async function createProjectKnowledge(data: {
    projectId: string; title: string; content?: string
}): Promise<ProjectKnowledgeEntry> {
    return trpcMutation<ProjectKnowledgeEntry>('projectKnowledge.create', data)
}

export async function updateProjectKnowledge(data: {
    id: string; title?: string; content?: string
}): Promise<ProjectKnowledgeEntry> {
    return trpcMutation<ProjectKnowledgeEntry>('projectKnowledge.update', data)
}

export async function deleteProjectKnowledge(id: string): Promise<void> {
    await trpcMutation('projectKnowledge.delete', { id })
}

// ── Prompt Templates ──

export type PromptTemplateType = 'unit_test' | 'spec_test'

export interface PromptTemplateResult {
    template: string
    isCustom: boolean
    id: string | null
}

export async function getPromptTemplate(teamId: string, type: PromptTemplateType): Promise<PromptTemplateResult> {
    return trpcQuery<PromptTemplateResult>('promptTemplate.get', { teamId, type })
}

export async function savePromptTemplate(teamId: string, type: PromptTemplateType, template: string): Promise<void> {
    await trpcMutation('promptTemplate.save', { teamId, type, template })
}

export async function resetPromptTemplate(teamId: string, type: PromptTemplateType): Promise<{ template: string }> {
    return trpcMutation<{ template: string }>('promptTemplate.reset', { teamId, type })
}

// ── Linked Test Approval ──

export async function approveLinkedTest(id: string, linkedFilePath: string, linkedHash: string) {
    return trpcMutation('testCase.approveLinkedTest', { id, linkedFilePath, linkedHash })
}

export async function approveLinkedSpecTest(id: string, linkedFilePath: string, linkedHash: string) {
    return trpcMutation('testCase.approveLinkedSpecTest', { id, linkedFilePath, linkedHash })
}

// ── Unit Test CRUD (via tRPC) ──

export interface TestCaseRecord {
    id: string; projectId: string; path: string; contentHash: string; description: string
    createdBy: string; linkedFilePath: string | null; linkedHash: string | null; linkedAt: string | null
    createdAt: string; updatedAt: string
}

export async function listTestCases(projectId: string): Promise<TestCaseRecord[]> {
    return trpcQuery<TestCaseRecord[]>('testCase.list', { projectId })
}

export async function createTestCaseInDB(data: {
    projectId: string; path: string; contentHash?: string; description?: string
}) {
    return trpcMutation('testCase.create', data)
}

export async function updateTestCaseInDB(id: string, data: { path?: string; contentHash?: string; description?: string }) {
    return trpcMutation('testCase.update', { id, ...data })
}

export async function deleteTestCaseInDB(id: string) {
    return trpcMutation('testCase.delete', { id })
}

// ── Spec Test CRUD (via tRPC) ──

export interface SpecTestRecord {
    id: string; projectId: string; groupId: string | null; title: string; description: string
    linkedFilePath: string | null; linkedHash: string | null; linkedAt: string | null
    createdAt: string; updatedAt: string
}

export interface SpecTestGroupRecord {
    id: string; projectId: string; key: string; name: string; parentKey: string | null
    preconditions: string; createdAt: string; updatedAt: string
}

export async function listSpecTests(projectId: string): Promise<SpecTestRecord[]> {
    return trpcQuery<SpecTestRecord[]>('testCase.listSpecTests', { projectId })
}

export async function listSpecTestGroups(projectId: string): Promise<SpecTestGroupRecord[]> {
    return trpcQuery<SpecTestGroupRecord[]>('testCase.listSpecTestGroups', { projectId })
}

export async function createSpecTestInDB(data: {
    projectId: string; title: string; description?: string; groupId?: string
}) {
    return trpcMutation('specTest.create', data)
}

export async function updateSpecTestInDB(id: string, data: { title?: string; description?: string }) {
    return trpcMutation('specTest.update', { id, ...data })
}

export async function deleteSpecTestInDB(id: string) {
    return trpcMutation('specTest.delete', { id })
}

export async function createSpecTestGroup(data: {
    projectId: string; key: string; name: string; parentKey?: string | null; preconditions?: string
}) {
    return trpcMutation('testCase.createSpecTestGroup', data)
}

// ── Unit Test Proposals ──

export type ProposalStatus = 'pending' | 'approved' | 'rejected'

export interface UnitTestProposal {
    id: string
    projectId: string
    path: string
    contentHash: string
    description: string
    proposedBy: string
    status: ProposalStatus
    linkedFilePath: string | null
    linkedHash: string | null
    reviewedBy: string | null
    reviewNote: string
    createdAt: string
    updatedAt: string
}

export async function listUnitTestProposals(projectId: string): Promise<UnitTestProposal[]> {
    return trpcQuery<UnitTestProposal[]>('testCase.listUnitTestProposals', { projectId })
}

export async function createUnitTestProposal(data: {
    projectId: string; path: string; contentHash?: string; description?: string; proposedBy: string
}): Promise<UnitTestProposal> {
    return trpcMutation<UnitTestProposal>('testCase.createUnitTestProposal', data)
}

export async function updateUnitTestProposalLink(id: string, linkedFilePath: string, linkedHash: string) {
    return trpcMutation('testCase.updateUnitTestProposalLink', { id, linkedFilePath, linkedHash })
}

export async function reviewUnitTestProposal(id: string, action: 'approve' | 'reject', reviewNote?: string) {
    return trpcMutation('testCase.reviewUnitTestProposal', { id, action, reviewNote: reviewNote || '' })
}

export async function deleteUnitTestProposal(id: string): Promise<void> {
    await trpcMutation('testCase.deleteUnitTestProposal', { id })
}

// ── Spec Test Proposals ──

export interface SpecTestProposal {
    id: string
    projectId: string
    title: string
    description: string
    groupKey: string | null
    proposedBy: string
    status: ProposalStatus
    linkedFilePath: string | null
    linkedHash: string | null
    reviewedBy: string | null
    reviewNote: string
    createdAt: string
    updatedAt: string
}

export async function listSpecTestProposals(projectId: string): Promise<SpecTestProposal[]> {
    return trpcQuery<SpecTestProposal[]>('testCase.listSpecTestProposals', { projectId })
}

export async function createSpecTestProposal(data: {
    projectId: string; title: string; description?: string; groupKey?: string | null; proposedBy: string
}): Promise<SpecTestProposal> {
    return trpcMutation<SpecTestProposal>('testCase.createSpecTestProposal', data)
}

export async function updateSpecTestProposalLink(id: string, linkedFilePath: string, linkedHash: string) {
    return trpcMutation('testCase.updateSpecTestProposalLink', { id, linkedFilePath, linkedHash })
}

export async function reviewSpecTestProposal(id: string, action: 'approve' | 'reject', reviewNote?: string) {
    return trpcMutation('testCase.reviewSpecTestProposal', { id, action, reviewNote: reviewNote || '' })
}

export async function deleteSpecTestProposal(id: string): Promise<void> {
    await trpcMutation('testCase.deleteSpecTestProposal', { id })
}

// ── Story Chat (AI) ──

export interface StoryResponse {
    enrichedText: string
    issues: { text: string; reason: string; suggestion: string }[]
    prompt: string
}

export async function storyChat(teamId: string, messages: { role: string; content: string }[]): Promise<StoryResponse> {
    return trpcMutation<StoryResponse>('story.chat', { teamId, messages })
}

// ── Story Proposals ──

export interface StoryProposal {
    id: string
    projectId: string
    title: string
    enrichedText: string
    prompt: string
    proposedBy: string
    status: ProposalStatus
    reviewedBy: string | null
    reviewNote: string
    createdAt: string
    updatedAt: string
}

export async function listStoryProposals(projectId: string): Promise<StoryProposal[]> {
    return trpcQuery<StoryProposal[]>('story.listProposals', { projectId })
}

export async function createStoryProposal(data: {
    projectId: string; title: string; enrichedText?: string; prompt?: string; proposedBy: string
}): Promise<StoryProposal> {
    return trpcMutation<StoryProposal>('story.createPoolEntry', data)
}

export async function reviewStoryProposal(id: string, action: 'approve' | 'reject', reviewNote?: string) {
    return trpcMutation('story.reviewProposal', { id, action, reviewNote: reviewNote || '' })
}

export async function deleteStoryProposal(id: string): Promise<void> {
    await trpcMutation('story.deleteProposal', { id })
}

