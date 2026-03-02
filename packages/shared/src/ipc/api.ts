import type { Note } from '../types'
import type { AddNotePayload, UpdateNotePayload } from './payloads'
import type { ScanResult, AiConfig, StoryMessage, StoryResponse, TestCase, SyntaxUnit, SpecTest, SpecTestGroup } from '../types'

/**
 * WorkspaceAPI — exposed to renderer via contextBridge.
 */
export interface WorkspaceAPI {
    /** Open a workspace folder (shows dialog if no path provided) */
    openWorkspace(path?: string): Promise<string | null>
    /** Open a workspace in a new window */
    openInNewWindow(path?: string): Promise<void>
    /** Get current workspace path for this window */
    getCurrent(): Promise<string | null>
    /** Get recent workspace list (filtered for existence) */
    getRecent(): Promise<string[]>
    /** Remove a path from recent workspaces */
    removeRecent(path: string): Promise<void>
}

/**
 * NotesAPI — exposed to renderer via contextBridge.
 */
export interface NotesAPI {
    loadNotes(projectId: string): Promise<Note[]>
    addNote(projectId: string, payload: AddNotePayload): Promise<Note>
    updateNote(payload: UpdateNotePayload): Promise<Note>
    deleteNote(id: string): Promise<void>
}

/**
 * CodeScanAPI — exposed to renderer via contextBridge.
 */
export interface CodeScanAPI {
    /** Run a full code scan on the current workspace */
    runScan(): Promise<ScanResult>
    /** Get the last scan result for the current workspace */
    getResult(): Promise<ScanResult | null>
    /** Get the source code of a file relative to workspace */
    getFileSource(relativePath: string): Promise<string | null>
}

/**
 * StoryAPI — exposed to renderer via contextBridge.
 */
export interface StoryAPI {
    /** Send chat messages and receive enriched response */
    chat(messages: StoryMessage[]): Promise<StoryResponse>
    /** Load stories for a project */
    load(projectId: string): Promise<unknown[]>
    /** Save chat items (deprecated — use addMessage) */
    save(items: unknown[]): Promise<void>
    /** Add a message to a story */
    addMessage(storyId: string, role: string, content: string, order: number): Promise<unknown>
}

/**
 * AiConfigAPI — exposed to renderer via contextBridge.
 */
export interface AiConfigAPI {
    /** Get current AI configuration */
    getConfig(): Promise<AiConfig>
    /** Save AI configuration */
    setConfig(config: AiConfig): Promise<void>
}

/**
 * TestsAPI — exposed to renderer via contextBridge.
 */
export interface TestsAPI {
    /** Load persisted test cases */
    load(projectId: string): Promise<TestCase[]>
    /** Save test cases */
    save(projectId: string, items: TestCase[]): Promise<void>
    /** Lookup syntax units by keyword in a file (scans file on-the-fly) */
    lookupUnit(filePath: string, keyword: string): Promise<SyntaxUnit[]>
    /** Sync: search workspace for test files matching [id] patterns */
    link(testIds: string[]): Promise<Record<string, { filePath: string; line: number }>>
}

/**
 * SpecTestsAPI — exposed to renderer via contextBridge.
 */
export interface SpecTestsAPI {
    /** Load persisted spec tests */
    load(projectId: string): Promise<SpecTest[]>
    /** Save spec tests */
    save(projectId: string, items: SpecTest[]): Promise<void>
    /** Lookup syntax units by keyword in a file (scans file on-the-fly) */
    lookupUnit(filePath: string, keyword: string): Promise<SyntaxUnit[]>
    /** Load spec test groups */
    loadGroups(projectId: string): Promise<SpecTestGroup[]>
    /** Save spec test groups */
    saveGroups(projectId: string, groups: SpecTestGroup[]): Promise<void>
    /** Link: search workspace for test files matching [id] patterns */
    link(testIds: string[]): Promise<Record<string, { filePath: string; line: number }>>
}

/**
 * AuthAPI — exposed to renderer via contextBridge.
 */
export interface AuthAPI {
    /** Login with email and password */
    login(email: string, password: string): Promise<{ userId: string; userName: string; email: string }>
    /** Register a new account */
    register(email: string, password: string): Promise<{ userId: string; userName: string; email: string }>
    /** Logout and clear session */
    logout(): Promise<void>
    /** Get current stored session */
    getSession(): Promise<{ token: string; userId: string; userName: string; email: string } | null>
    syncSession(data: { token: string; userId: string; userName: string; email: string }): Promise<void>
}

/**
 * GitAPI — exposed to renderer via contextBridge.
 */
export interface GitAPI {
    /** Get git status for the current workspace */
    getStatus(): Promise<{
        branch: string
        commit: string
        commitShort: string
        changedFiles: number
        dirty: boolean
        version: string
    } | null>
    /** Get the remote origin URL for a workspace path */
    getRemoteOrigin(workspacePath: string): Promise<string | null>
}

/**
 * TeamAPI — exposed to renderer via contextBridge.
 */
export interface TeamAPI {
    /** List teams the current user belongs to */
    list(): Promise<{ id: string; name: string; slug: string }[]>
    /** Ensure the user has at least one team (auto-create if needed) */
    ensure(): Promise<{ id: string; name: string; slug: string }>
}

/**
 * ProjectAPI — exposed to renderer via contextBridge.
 */
export interface ProjectAPI {
    /** Find or create a project by slug (git remote origin) within a team */
    ensure(teamId: string, slug: string, name: string): Promise<{ id: string; name: string; slug: string }>
}

/**
 * TeamAiConfigAPI — exposed to renderer via contextBridge.
 */
export interface TeamAiConfigAPI {
    /** List AI configs for a team */
    list(teamId: string): Promise<{
        id: string; teamId: string; provider: string; apiKey: string
        baseUrl: string; models: string[]; isDefault: boolean
    }[]>
    /** Create or update an AI config */
    upsert(data: {
        id?: string; teamId: string; provider: string; apiKey: string
        baseUrl?: string; models?: string[]; isDefault?: boolean
    }): Promise<unknown>
    /** Delete an AI config */
    delete(id: string): Promise<void>
}
