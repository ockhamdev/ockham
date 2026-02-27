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
 * Get the directory for storing spec test cases.
 */
function getTestsDir(ws: string): string {
    return path.join(ws, '.ockham', 'spec-tests')
}

/**
 * Register Spec Tests IPC handlers.
 * Each test case is stored as an individual markdown file.
 */
export function registerSpecTestsHandlers(): void {
    // Load all test cases from .ockham/spec-tests/*.md
    ipcMain.handle(IPC.SPEC_TESTS_LOAD, async (event): Promise<TestCase[]> => {
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

    // Save test cases as .ockham/spec-tests/{hash}.md
    ipcMain.handle(IPC.SPEC_TESTS_SAVE, async (event, items: TestCase[]) => {
        const ws = windowManager.getWorkspace(event.sender.id)
        if (!ws) throw new Error('No workspace selected')
        const dir = getTestsDir(ws)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

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

        for (const tc of items) {
            const fileName = `${tc.id}.md`
            fs.writeFileSync(
                path.join(dir, fileName),
                serializeTestCaseMd(tc),
                'utf-8'
            )
        }
    })

    // Lookup syntax units by keyword
    ipcMain.handle(
        IPC.SPEC_TESTS_LOOKUP_UNIT,
        async (event, filePath: string, keyword: string): Promise<SyntaxUnit[]> => {
            const ws = windowManager.getWorkspace(event.sender.id)
            if (!ws) return []

            const fileEntry = codescanStore.scanFile(ws, filePath)
            if (!fileEntry) return []

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
}
