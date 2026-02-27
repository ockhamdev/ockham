/**
 * Note — domain entity for the Notes feature module.
 */
export interface Note {
    id: string
    title: string
    content: string
    createdAt: string
    updatedAt: string
}

/**
 * AppConfig — persisted to ~/.ockham/config.json
 */
export interface AppConfig {
    /** Last opened workspace path */
    lastWorkspace?: string
    /** Recent workspace paths (max 10, deduped) */
    recentWorkspaces?: string[]
}

// Re-export codescan types for use in shared API and renderer
export type {
    ScanResult,
    FileEntry,
    SyntaxUnit,
} from '@ockham/codescan'

// ── AI types ──────────────────────────────────────────

export interface AiConfig {
    apiKey: string
    baseUrl?: string
    model?: string
}

export interface TokenUsage {
    inputTokens: number
    outputTokens: number
    model: string
    timestamp: string
}

export interface ObjectTreeNode {
    id?: string
    title: string
    description?: string
    completed?: boolean
    isState?: boolean
    children?: ObjectTreeNode[]
}

export interface RelatedFile {
    filePath: string
    relevance: string
}

export interface ObjectMapping {
    objectTitle: string
    status: string
    summary: string
    relatedFiles?: RelatedFile[]
}

export interface ObjectMappingResult extends ObjectMapping {
    objectId?: string
    tokenUsage?: TokenUsage
    implFiles?: RelatedFile[]
    testFiles?: RelatedFile[]
    scannedAt?: string
    [key: string]: unknown
}

export interface AnalysisResult {
    mappings: ObjectMapping[]
    tokenUsage: TokenUsage
    systemPrompt: string
    userPrompt: string
    rawResponse: string
    directoryTree?: string
}

export interface ScanProgressEvent {
    type?: 'start' | 'progress' | 'complete' | 'error'
    objectTitle?: string
    objectId?: string
    status?: string
    current?: number
    total?: number
    message?: string
    error?: string
    [key: string]: unknown
}

// ── Story types ───────────────────────────────────────

export interface StoryMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface StoryIssue {
    text: string
    reason: string
    suggestion: string
}

export interface StoryResponse {
    enrichedText: string
    issues: StoryIssue[]
    prompt: string
}

// ── Tests types ───────────────────────────────────────

export interface TestCase {
    /** SHA-1 hash of path — also used as the storage filename */
    id: string
    /** Original user input: "filePath keyword", e.g. "src/App.tsx const CodePage" */
    path: string
    /** SHA-1 content hash of the syntax unit */
    contentHash: string
    /** Test case description */
    description: string
    /** Created timestamp */
    createdAt: string
}

// ── Spec Tests types ─────────────────────────────────

/** A single syntax-unit reference within a spec test */
export interface SpecTestUnit {
    /** Lookup path: "filepath keyword", e.g. "src/App.tsx CodePage" */
    path: string
    /** Resolved unit name (from lookup) */
    unitName: string
    /** Resolved unit type (from lookup) */
    unitType: string
    /** Resolved file path (from lookup) */
    unitFilePath: string
    /** Content hash of the resolved syntax unit */
    contentHash: string
}

/** A spec test — references multiple syntax units */
export interface SpecTest {
    /** sha1(uuid) — unique ID */
    id: string
    /** Test title */
    title: string
    /** Group key this test belongs to */
    group: string
    /** Test description */
    description: string
    /** Referenced syntax units */
    units: SpecTestUnit[]
    /** Created timestamp */
    createdAt: string
}

/** A spec test group with optional preconditions */
export interface SpecTestGroup {
    /** Group key (unique identifier) */
    key: string
    /** Group display name */
    name: string
    /** Parent group key (undefined = root level) */
    parentKey?: string
    /** Precondition description, e.g. "unified login required" */
    preconditions: string
}
