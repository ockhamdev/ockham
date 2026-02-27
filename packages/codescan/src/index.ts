// Core API
export { runCodeScan, scanSingleFile } from './codeScan'

// Types
export type {
    SyntaxUnit,
    FileEntry,
    ScanResult,
    ScanOutput,
    LanguageScanner,
} from './types'

// Scanners
export { typescriptScanner } from './scanners/typescriptScanner'
