import fs from 'fs'
import path from 'path'
import { collectFiles } from './fileCollector'
import { typescriptScanner } from './scanners/typescriptScanner'
import type { ScanResult, FileEntry, LanguageScanner } from './types'

/** All registered language scanners */
const scanners: LanguageScanner[] = [typescriptScanner]

/**
 * Build a map from file extension to scanner for fast lookup.
 */
function buildExtensionMap(): Map<string, LanguageScanner> {
    const map = new Map<string, LanguageScanner>()
    for (const scanner of scanners) {
        for (const ext of scanner.extensions) {
            map.set(ext, scanner)
        }
    }
    return map
}

/**
 * Run a full code scan on the given workspace.
 *
 * 1. Collect all files respecting .gitignore
 * 2. For each file: match extension → pick scanner → extract syntax units
 * 3. Compute per-file line coverage
 * 4. Return result in memory (no file persistence)
 */
export function runCodeScan(workspacePath: string): ScanResult {
    // 1. Collect files
    const collectedFiles = collectFiles(workspacePath)
    const extensionMap = buildExtensionMap()

    // 2 & 3. Scan each file
    const files: FileEntry[] = collectedFiles.map((file) => {
        const ext = path.extname(file.relativePath).slice(1).toLowerCase()
        const scanner = extensionMap.get(ext)

        if (!scanner) {
            // No scanner for this file type — 0% coverage
            return {
                filePath: file.relativePath,
                totalLines: file.totalLines,
                coveredLines: [],
                coveragePercent: 0,
                syntaxUnits: [],
            }
        }

        // Read source and scan
        const source = fs.readFileSync(file.absolutePath, 'utf-8')
        const output = scanner.scan(file.absolutePath, file.relativePath, source)

        const coveragePercent =
            file.totalLines > 0
                ? Math.round((output.coveredLines.length / file.totalLines) * 10000) / 100
                : 0

        return {
            filePath: file.relativePath,
            totalLines: file.totalLines,
            coveredLines: output.coveredLines,
            coveragePercent,
            syntaxUnits: output.syntaxUnits,
        }
    })

    // Build and return result (in-memory only)
    return {
        workspacePath,
        scannedAt: new Date().toISOString(),
        totalFiles: files.length,
        files,
    }
}

/**
 * Scan a single file and return its FileEntry.
 *
 * @param workspacePath - Absolute path of the workspace root
 * @param relativePath  - File path relative to workspace root
 * @returns FileEntry for the file, or null if the file doesn't exist or has no scanner
 */
export function scanSingleFile(workspacePath: string, relativePath: string): FileEntry | null {
    const absolutePath = path.join(workspacePath, relativePath)

    if (!fs.existsSync(absolutePath)) {
        return null
    }

    const ext = path.extname(relativePath).slice(1).toLowerCase()
    const extensionMap = buildExtensionMap()
    const scanner = extensionMap.get(ext)

    const source = fs.readFileSync(absolutePath, 'utf-8')
    const totalLines = source.split('\n').length

    if (!scanner) {
        return {
            filePath: relativePath,
            totalLines,
            coveredLines: [],
            coveragePercent: 0,
            syntaxUnits: [],
        }
    }

    const output = scanner.scan(absolutePath, relativePath, source)

    const coveragePercent =
        totalLines > 0
            ? Math.round((output.coveredLines.length / totalLines) * 10000) / 100
            : 0

    return {
        filePath: relativePath,
        totalLines,
        coveredLines: output.coveredLines,
        coveragePercent,
        syntaxUnits: output.syntaxUnits,
    }
}
