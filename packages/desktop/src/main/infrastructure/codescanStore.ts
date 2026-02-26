import { runCodeScan, loadScanResult } from '@ockham/codescan'
import type { ScanResult } from '@ockham/shared'

/**
 * Run a full code scan on the workspace.
 */
export function executeScan(workspacePath: string): ScanResult {
    return runCodeScan(workspacePath)
}

/**
 * Load the last scan result from workspace.
 */
export function getLastScanResult(workspacePath: string): ScanResult | null {
    return loadScanResult(workspacePath)
}
