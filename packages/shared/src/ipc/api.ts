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
    loadNotes(): Promise<Note[]>
    addNote(payload: AddNotePayload): Promise<Note>
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
    /** Load persisted chat items */
    load(): Promise<unknown[]>
    /** Save chat items */
    save(items: unknown[]): Promise<void>
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
    load(): Promise<TestCase[]>
    /** Save test cases */
    save(items: TestCase[]): Promise<void>
    /** Lookup syntax units by keyword in a file (scans file on-the-fly) */
    lookupUnit(filePath: string, keyword: string): Promise<SyntaxUnit[]>
    /** Sync: search workspace for test files matching [id] patterns */
    sync(testIds: string[]): Promise<Record<string, { filePath: string; line: number }>>
}

/**
 * SpecTestsAPI — exposed to renderer via contextBridge.
 */
export interface SpecTestsAPI {
    /** Load persisted spec tests */
    load(): Promise<SpecTest[]>
    /** Save spec tests */
    save(items: SpecTest[]): Promise<void>
    /** Lookup syntax units by keyword in a file (scans file on-the-fly) */
    lookupUnit(filePath: string, keyword: string): Promise<SyntaxUnit[]>
    /** Load spec test groups */
    loadGroups(): Promise<SpecTestGroup[]>
    /** Save spec test groups */
    saveGroups(groups: SpecTestGroup[]): Promise<void>
}
