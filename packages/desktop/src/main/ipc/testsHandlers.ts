import { ipcMain } from 'electron'
import { IPC } from '@ockham/shared'
import type { TestCase, SyntaxUnit } from '@ockham/shared'
import { windowManager } from '../windowManager'
import * as codescanStore from '../infrastructure/codescanStore'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Register Tests IPC handlers.
 */
export function registerTestsHandlers(): void {
    // Load test cases from .ockham/tests.json
    ipcMain.handle(IPC.TESTS_LOAD, async (event): Promise<TestCase[]> => {
        const ws = windowManager.getWorkspace(event.sender.id)
        if (!ws) return []
        const testsPath = path.join(ws, '.ockham', 'tests.json')
        try {
            if (fs.existsSync(testsPath)) {
                return JSON.parse(fs.readFileSync(testsPath, 'utf-8'))
            }
        } catch {
            // ignore
        }
        return []
    })

    // Save test cases to .ockham/tests.json
    ipcMain.handle(IPC.TESTS_SAVE, async (event, items: TestCase[]) => {
        const ws = windowManager.getWorkspace(event.sender.id)
        if (!ws) throw new Error('No workspace selected')
        const dir = path.join(ws, '.ockham')
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(
            path.join(dir, 'tests.json'),
            JSON.stringify(items, null, 2),
            'utf-8'
        )
    })

    // Lookup syntax unit at file + line from last scan result
    ipcMain.handle(
        IPC.TESTS_LOOKUP_UNIT,
        async (event, filePath: string, line: number): Promise<SyntaxUnit | null> => {
            const ws = windowManager.getWorkspace(event.sender.id)
            if (!ws) return null

            const result = codescanStore.getLastScanResult(ws)
            if (!result) return null

            const fileEntry = result.files.find((f) => f.filePath === filePath)
            if (!fileEntry) return null

            // Find the syntax unit that contains the given line
            const unit = fileEntry.syntaxUnits.find(
                (u) => u.startLine <= line && u.endLine >= line
            )
            return unit || null
        }
    )
}
