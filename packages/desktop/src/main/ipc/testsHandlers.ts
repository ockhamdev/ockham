import { ipcMain } from 'electron'
import { IPC } from '@ockham/shared'
import type { TestCase, SyntaxUnit } from '@ockham/shared'
import { windowManager } from '../windowManager'
import * as codescanStore from '../infrastructure/codescanStore'
import * as fs from 'fs'
import * as path from 'path'


/**
 * Parse a test case markdown file back into a TestCase object.
 */
function parseTestCaseMd(content: string): TestCase | null {
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
    if (!fmMatch) return null

    const yamlBlock = fmMatch[1]
    const description = fmMatch[2].trim()

    const fields: Record<string, string> = {}
    for (const line of yamlBlock.split('\n')) {
        const colonIdx = line.indexOf(':')
        if (colonIdx === -1) continue
        const key = line.slice(0, colonIdx).trim()
        const val = line.slice(colonIdx + 1).trim()
        fields[key] = val
    }

    if (!fields.id) return null

    // Derive path from filePath+keyword for backward compatibility
    const testPath = fields.path || (fields.filePath && fields.keyword ? `${fields.filePath} ${fields.keyword}` : '')
    if (!testPath) return null

    return {
        id: fields.id,
        path: testPath,
        contentHash: fields.contentHash || '',
        description,
        createdAt: fields.createdAt || '',
    }
}

/**
 * Serialize a TestCase to markdown with YAML frontmatter.
 */
function serializeTestCaseMd(tc: TestCase): string {
    const yaml = [
        `id: ${tc.id}`,
        `path: ${tc.path}`,
        `contentHash: ${tc.contentHash}`,
        `createdAt: ${tc.createdAt}`,
    ].join('\n')
    return `---\n${yaml}\n---\n${tc.description}\n`
}

/**
 * Get the directory for storing unit test cases.
 */
function getTestsDir(ws: string): string {
    return path.join(ws, '.ockham', 'unit-tests')
}

/**
 * Register Unit Tests IPC handlers.
 * Each test case is stored as an individual markdown file.
 */
export function registerTestsHandlers(): void {
    // Load all test cases from .ockham/unit-tests/*.md
    ipcMain.handle(IPC.TESTS_LOAD, async (event): Promise<TestCase[]> => {
        const ws = windowManager.getWorkspace(event.sender.id)
        if (!ws) return []
        const dir = getTestsDir(ws)
        try {
            if (!fs.existsSync(dir)) return []
            const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
            const results: TestCase[] = []
            for (const file of files) {
                const content = fs.readFileSync(path.join(dir, file), 'utf-8')
                const tc = parseTestCaseMd(content)
                if (tc) results.push(tc)
            }
            return results
        } catch {
            return []
        }
    })

    // Save a single test case as .ockham/unit-tests/{hash}.md
    ipcMain.handle(IPC.TESTS_SAVE, async (event, items: TestCase[]) => {
        const ws = windowManager.getWorkspace(event.sender.id)
        if (!ws) throw new Error('No workspace selected')
        const dir = getTestsDir(ws)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        // Write each test case as a separate file
        // First, remove any existing files that are no longer in the list
        const existingFiles = fs.existsSync(dir)
            ? fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
            : []
        const newFileNames = new Set(
            items.map((tc) => `${tc.id}.md`)
        )
        for (const file of existingFiles) {
            if (!newFileNames.has(file)) {
                fs.unlinkSync(path.join(dir, file))
            }
        }

        // Write all current test cases
        for (const tc of items) {
            const fileName = `${tc.id}.md`
            fs.writeFileSync(
                path.join(dir, fileName),
                serializeTestCaseMd(tc),
                'utf-8'
            )
        }
    })

    // Lookup syntax units by keyword — scans the single file on-the-fly
    ipcMain.handle(
        IPC.TESTS_LOOKUP_UNIT,
        async (event, filePath: string, keyword: string): Promise<SyntaxUnit[]> => {
            const ws = windowManager.getWorkspace(event.sender.id)
            if (!ws) return []

            // Scan this single file
            const fileEntry = codescanStore.scanFile(ws, filePath)
            if (!fileEntry) return []

            // Tokenize keyword for matching (e.g. "const name" → ["const", "name"])
            const tokens = keyword.toLowerCase().split(/\s+/).filter(Boolean)
            if (tokens.length === 0) return []

            // JS/TS keyword → scanner type aliases
            const keywordTypeAliases: Record<string, string[]> = {
                const: ['variable'],
                let: ['variable'],
                var: ['variable'],
                function: ['function', 'arrowfunction'],
                class: ['class'],
                interface: ['interface'],
                type: ['typealias'],
                enum: ['enum'],
                export: [], // skip 'export' — it's a modifier, not a type
            }

            // Match syntax units: every token must appear in the type, name,
            // OR be a known JS keyword that maps to the unit's type
            return fileEntry.syntaxUnits.filter((u) => {
                const haystack = `${u.type} ${u.name}`.toLowerCase()
                return tokens.every((t) => {
                    // Direct match in type or name
                    if (haystack.includes(t)) return true
                    // Keyword alias match
                    const aliases = keywordTypeAliases[t]
                    if (aliases) {
                        if (aliases.length === 0) return true // skip token (e.g. 'export')
                        return aliases.some((a) => u.type.toLowerCase().includes(a))
                    }
                    return false
                })
            })
        }
    )

    // Link: search workspace test files for [id] patterns
    ipcMain.handle(
        IPC.TESTS_LINK,
        async (event, testIds: string[]): Promise<Record<string, { filePath: string; line: number }>> => {
            const ws = windowManager.getWorkspace(event.sender.id)
            if (!ws) return {}

            const result: Record<string, { filePath: string; line: number }> = {}
            const idSet = new Set(testIds)

            // Recursively find test files
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
                        // Match [id] in describe blocks
                        const match = lines[i].match(/\[([a-f0-9]{40})\]/)
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
}
