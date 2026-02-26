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
