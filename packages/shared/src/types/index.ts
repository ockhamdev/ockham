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
    /** UUID v7 */
    id: string
    /** Composite key: relativePath::syntaxUnitType */
    key: string
    /** Relative file path */
    filePath: string
    /** Line number used to locate the syntax unit */
    line: number
    /** Syntax unit type, e.g. 'FunctionDeclaration' */
    unitType: string
    /** Syntax unit name, e.g. 'handleSend' */
    unitName: string
    /** Test case description */
    description: string
    /** Created timestamp */
    createdAt: string
}
