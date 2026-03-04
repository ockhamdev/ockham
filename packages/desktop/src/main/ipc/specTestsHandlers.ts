import { ipcMain } from 'electron'
import { IPC } from '@ockham/shared'
import type { SpecTest, SpecTestGroup, SyntaxUnit } from '@ockham/shared'
import { windowManager } from '../windowManager'
import * as codescanStore from '../infrastructure/codescanStore'
import { trpcQuery, trpcMutation } from '../infrastructure/apiClient'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Register Spec Tests IPC handlers.
 * CRUD operations use Web API; codescan lookups and test linking stay local.
 */
export function registerSpecTestsHandlers(): void {
    // ── Load all spec tests from Web API ──
    ipcMain.handle(IPC.SPEC_TESTS_LOAD, async (_event, projectId: string): Promise<SpecTest[]> => {
        if (!projectId) return []
        return trpcQuery<SpecTest[]>('testCase.listSpecTests', { projectId })
    })

    // ── Save spec tests via Web API ──
    ipcMain.handle(IPC.SPEC_TESTS_SAVE, async (_event, projectId: string, items: SpecTest[]) => {
        for (const st of items) {
            if (st.id) {
                await trpcMutation('testCase.updateSpecTest', {
                    id: st.id,
                    title: st.title,
                    description: st.description,
                })
            } else {
                await trpcMutation('testCase.createSpecTest', {
                    projectId,
                    title: st.title,
                    description: st.description || '',
                })
            }
        }
    })

    // ── Lookup syntax units by keyword — local codescan (unchanged) ──
    ipcMain.handle(
        IPC.SPEC_TESTS_LOOKUP_UNIT,
        async (event, filePath: string, keyword: string): Promise<SyntaxUnit[]> => {
            const ws = windowManager.getWorkspace(event.sender.id)
            if (!ws) return []

            const fileEntry = codescanStore.scanFile(ws, filePath)
            if (!fileEntry) return []

            const tokens = keyword.toLowerCase().split(/\s+/).filter(Boolean)
            if (tokens.length === 0) return []

            const keywordTypeAliases: Record<string, string[]> = {
                const: ['variable'],
                let: ['variable'],
                var: ['variable'],
                function: ['function', 'arrowfunction'],
                class: ['class'],
                interface: ['interface'],
                type: ['typealias'],
                enum: ['enum'],
                export: [],
            }

            return fileEntry.syntaxUnits.filter((u) => {
                const haystack = `${u.type} ${u.name}`.toLowerCase()
                return tokens.every((t) => {
                    if (haystack.includes(t)) return true
                    const aliases = keywordTypeAliases[t]
                    if (aliases) {
                        if (aliases.length === 0) return true
                        return aliases.some((a) => u.type.toLowerCase().includes(a))
                    }
                    return false
                })
            })
        }
    )

    // ── Load groups from Web API ──
    ipcMain.handle(IPC.SPEC_TESTS_LOAD_GROUPS, async (_event, projectId: string): Promise<SpecTestGroup[]> => {
        if (!projectId) return []
        return trpcQuery<SpecTestGroup[]>('testCase.listSpecTestGroups', { projectId })
    })

    // ── Save groups via Web API ──
    ipcMain.handle(IPC.SPEC_TESTS_SAVE_GROUPS, async (_event, projectId: string, groups: SpecTestGroup[]) => {
        for (const group of groups) {
            await trpcMutation('testCase.createSpecTestGroup', {
                projectId,
                key: group.key,
                name: group.name,
                parentKey: group.parentKey || null,
                preconditions: group.preconditions || '',
            })
        }
    })

    // ── Link: search workspace test files — local (unchanged) ──
    ipcMain.handle(
        IPC.SPEC_TESTS_LINK,
        async (event, testIds: string[]): Promise<Record<string, { filePath: string; line: number }>> => {
            const ws = windowManager.getWorkspace(event.sender.id)
            if (!ws) return {}

            const result: Record<string, { filePath: string; line: number }> = {}
            const idSet = new Set(testIds)

            function findTestFiles(dir: string, relativeTo: string): string[] {
                const files: string[] = []
                try {
                    const entries = fs.readdirSync(dir, { withFileTypes: true })
                    for (const entry of entries) {
                        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.ockham') continue
                        const fullPath = path.join(dir, entry.name)
                        if (entry.isDirectory()) {
                            files.push(...findTestFiles(fullPath, relativeTo))
                        } else if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) {
                            files.push(path.relative(relativeTo, fullPath))
                        }
                    }
                } catch {
                    // ignore
                }
                return files
            }

            const testFiles = findTestFiles(ws, ws)

            for (const relPath of testFiles) {
                try {
                    const content = fs.readFileSync(path.join(ws, relPath), 'utf-8')
                    const lines = content.split('\n')
                    for (let i = 0; i < lines.length; i++) {
                        const match = lines[i].match(/\[spec:([a-f0-9-]{36})\]/)
                        if (match && idSet.has(match[1])) {
                            result[match[1]] = { filePath: relPath, line: i + 1 }
                        }
                    }
                } catch {
                    // ignore
                }
            }

            return result
        }
    )

    // Read test block source — given filePath + line, return the describe block content
    ipcMain.handle(
        IPC.SPEC_TESTS_READ_BLOCK,
        async (event, filePath: string, line: number): Promise<string> => {
            const ws = windowManager.getWorkspace(event.sender.id)
            if (!ws) return ''

            try {
                const content = fs.readFileSync(path.join(ws, filePath), 'utf-8')
                const lines = content.split('\n')
                const matchLine = line // 1-indexed

                let braceCount = 0
                let foundOpen = false
                let blockEnd = matchLine
                for (let i = matchLine - 1; i < lines.length; i++) {
                    const lineText = lines[i]
                    for (const ch of lineText) {
                        if (ch === '{') { braceCount++; foundOpen = true }
                        if (ch === '}') braceCount--
                    }
                    if (foundOpen && braceCount <= 0) {
                        blockEnd = i + 1
                        break
                    }
                }

                return lines.slice(matchLine - 1, blockEnd).join('\n')
            } catch {
                return ''
            }
        }
    )
}
