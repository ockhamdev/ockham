import fs from 'fs'
import path from 'path'
import { collectFiles } from './fileCollector'
import { typescriptScanner } from './scanners/typescriptScanner'
import type { ScanResult, FileEntry, LanguageScanner } from './types'

const TMP_DIR = '/tmp/ockham-codescan'
const RESULT_FILE = 'codescan-result.json'
const DATA_DIR = '.ockham'

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
 * 1. Clean /tmp/ockham-codescan/ (recreate)
 * 2. Collect all files respecting .gitignore
 * 3. For each file: match extension → pick scanner → extract syntax units
 * 4. Compute per-file line coverage
 * 5. Save intermediate result to /tmp
 * 6. Save final result to {workspace}/.ockham/codescan-result.json
 */
export function runCodeScan(workspacePath: string): ScanResult {
    // 1. Clean tmp directory
    if (fs.existsSync(TMP_DIR)) {
        fs.rmSync(TMP_DIR, { recursive: true, force: true })
    }
    fs.mkdirSync(TMP_DIR, { recursive: true })

    // 2. Collect files
    const collectedFiles = collectFiles(workspacePath)
    const extensionMap = buildExtensionMap()

    // 3 & 4. Scan each file
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

    // Build result
    const result: ScanResult = {
        workspacePath,
        scannedAt: new Date().toISOString(),
        totalFiles: files.length,
        files,
    }

    // 5. Save to tmp (intermediate)
    const tmpResultPath = path.join(TMP_DIR, RESULT_FILE)
    fs.writeFileSync(tmpResultPath, JSON.stringify(result, null, 2), 'utf-8')

    // 6. Save to workspace/.ockham/ (final)
    const ockhamDir = path.join(workspacePath, DATA_DIR)
    if (!fs.existsSync(ockhamDir)) {
        fs.mkdirSync(ockhamDir, { recursive: true })
    }
    const finalResultPath = path.join(ockhamDir, RESULT_FILE)
    fs.writeFileSync(finalResultPath, JSON.stringify(result, null, 2), 'utf-8')

    return result
}

/**
 * Load the last scan result from a workspace.
 */
export function loadScanResult(workspacePath: string): ScanResult | null {
    const resultPath = path.join(workspacePath, DATA_DIR, RESULT_FILE)
    if (!fs.existsSync(resultPath)) {
        return null
    }
    try {
        const raw = fs.readFileSync(resultPath, 'utf-8')
        return JSON.parse(raw) as ScanResult
    } catch {
        return null
    }
}
