import { runCodeScan, scanSingleFile } from '@ockham/codescan'
import type { ScanResult, FileEntry } from '@ockham/shared'

/** In-memory cache of scan results, keyed by workspace path */
const cache = new Map<string, ScanResult>()

/**
 * Run a full code scan on the workspace and cache the result in memory.
 */
export function executeScan(workspacePath: string): ScanResult {
    const result = runCodeScan(workspacePath)
    cache.set(workspacePath, result)
    return result
}

/**
 * Get the last scan result from in-memory cache.
 */
export function getLastScanResult(workspacePath: string): ScanResult | null {
    return cache.get(workspacePath) ?? null
}

/**
 * Scan a single file and merge the result into the cache.
 * If no cached ScanResult exists, creates a minimal one.
 * Returns the FileEntry, or null if scan fails.
 */
export function scanFile(workspacePath: string, relativePath: string): FileEntry | null {
    const fileEntry = scanSingleFile(workspacePath, relativePath)
    if (!fileEntry) return null

    // Merge into cache
    let result = cache.get(workspacePath)
    if (result) {
        // Replace or append the file entry
        const idx = result.files.findIndex((f) => f.filePath === relativePath)
        if (idx >= 0) {
            result.files[idx] = fileEntry
        } else {
            result.files.push(fileEntry)
            result.totalFiles = result.files.length
        }
        result.scannedAt = new Date().toISOString()
    } else {
        // Create a minimal ScanResult
        result = {
            workspacePath,
            scannedAt: new Date().toISOString(),
            totalFiles: 1,
            files: [fileEntry],
        }
        cache.set(workspacePath, result)
    }

    return fileEntry
}

