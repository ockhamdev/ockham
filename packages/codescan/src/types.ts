/**
 * Core types for the CodeScan system.
 */

/**
 * A single syntax unit extracted from a source file.
 */
export interface SyntaxUnit {
    /** Syntax kind, e.g. 'FunctionDeclaration', 'ClassDeclaration' */
    type: string
    /** Identifier name, or '<anonymous>' */
    name: string
    /** File path relative to workspace root */
    filePath: string
    /** Start position */
    startLine: number
    startColumn: number
    /** End position */
    endLine: number
    endColumn: number
    /** SHA1 hash of the syntax unit's source text */
    sha1: string
}

/**
 * A single file entry in the scan result.
 */
export interface FileEntry {
    /** File path relative to workspace root */
    filePath: string
    /** Total number of lines in this file */
    totalLines: number
    /** Line numbers that were identified by scanners as containing valid syntax */
    coveredLines: number[]
    /** Percentage of lines covered (0-100) */
    coveragePercent: number
    /** All syntax units extracted from this file */
    syntaxUnits: SyntaxUnit[]
}

/**
 * The full result of a workspace scan.
 */
export interface ScanResult {
    /** Absolute path of the scanned workspace */
    workspacePath: string
    /** ISO timestamp of when the scan was performed */
    scannedAt: string
    /** Total number of files scanned */
    totalFiles: number
    /** Per-file scan results */
    files: FileEntry[]
}

/**
 * Interface that language-specific scanners must implement.
 */
export interface LanguageScanner {
    /** File extensions this scanner handles (without dot), e.g. ['ts', 'tsx'] */
    extensions: string[]
    /** Scan a source file and return syntax units + covered line numbers */
    scan(
        absolutePath: string,
        relativePath: string,
        source: string
    ): ScanOutput
}

/**
 * Output from a language-specific scanner.
 */
export interface ScanOutput {
    /** Line numbers that contain valid syntax identified by the scanner */
    coveredLines: number[]
    /** Extracted syntax units */
    syntaxUnits: SyntaxUnit[]
}
