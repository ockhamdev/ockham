import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { IPC } from '@ockham/shared'
import type { ScanResult } from '@ockham/shared'
import { windowManager } from '../windowManager'
import * as codescanStore from '../infrastructure/codescanStore'

/**
 * Register CodeScan IPC handlers.
 */
export function registerCodescanHandlers(): void {
    ipcMain.handle(IPC.CODESCAN_RUN, (event): ScanResult => {
        const workspace = windowManager.getWorkspace(event.sender.id)
        if (!workspace) throw new Error('No workspace bound to this window')
        return codescanStore.executeScan(workspace)
    })

    ipcMain.handle(IPC.CODESCAN_GET_RESULT, (event): ScanResult | null => {
        const workspace = windowManager.getWorkspace(event.sender.id)
        if (!workspace) return null
        return codescanStore.getLastScanResult(workspace)
    })

    ipcMain.handle(
        IPC.CODESCAN_GET_FILE_SOURCE,
        (event, relativePath: string): string | null => {
            const workspace = windowManager.getWorkspace(event.sender.id)
            if (!workspace) return null
            const filePath = path.join(workspace, relativePath)
            try {
                return fs.readFileSync(filePath, 'utf-8')
            } catch {
                return null
            }
        }
    )
}
