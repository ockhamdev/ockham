import { ipcMain } from 'electron'
import { IPC } from '@ockham/shared'
import type { SpecTest, SpecTestGroup, SyntaxUnit } from '@ockham/shared'
import { windowManager } from '../windowManager'
import * as codescanStore from '../infrastructure/codescanStore'
import * as fs from 'fs'
import * as path from 'path'


/**
 * Parse a spec test markdown file back into a SpecTest object.
 */
function parseSpecTestMd(content: string): SpecTest | null {
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

    // Parse units from JSON field
    let units: SpecTest['units'] = []
    if (fields.units) {
        try {
            units = JSON.parse(fields.units)
        } catch {
            units = []
        }
    }

    return {
        id: fields.id,
        title: fields.title || '',
        group: fields.group || 'default',
        description,
        units,
        createdAt: fields.createdAt || '',
    }
}

/**
 * Serialize a SpecTest to markdown with YAML frontmatter.
 */
function serializeSpecTestMd(st: SpecTest): string {
    const yaml = [
        `id: ${st.id}`,
        `title: ${st.title}`,
        `group: ${st.group}`,
        `units: ${JSON.stringify(st.units)}`,
        `createdAt: ${st.createdAt}`,
    ].join('\n')
    return `---\n${yaml}\n---\n${st.description}\n`
}

/**
 * Get the directory for storing spec test cases.
 */
function getTestsDir(ws: string): string {
    return path.join(ws, '.ockham', 'spec-tests')
}

/**
 * Default group that always exists.
 */
const DEFAULT_GROUP: SpecTestGroup = {
    key: 'default',
    name: 'Default',
    preconditions: '',
}

/**
 * Register Spec Tests IPC handlers.
 */
export function registerSpecTestsHandlers(): void {
    // ── Load all spec tests ──
    ipcMain.handle(IPC.SPEC_TESTS_LOAD, async (event): Promise<SpecTest[]> => {
        const ws = windowManager.getWorkspace(event.sender.id)
        if (!ws) return []
        const dir = getTestsDir(ws)
        try {
            if (!fs.existsSync(dir)) return []
            const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
            const results: SpecTest[] = []
            for (const file of files) {
                const content = fs.readFileSync(path.join(dir, file), 'utf-8')
                const st = parseSpecTestMd(content)
                if (st) results.push(st)
            }
            return results
        } catch {
            return []
        }
    })

    // ── Save spec tests ──
    ipcMain.handle(IPC.SPEC_TESTS_SAVE, async (event, items: SpecTest[]) => {
        const ws = windowManager.getWorkspace(event.sender.id)
        if (!ws) throw new Error('No workspace selected')
        const dir = getTestsDir(ws)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        // Remove deleted files
        const existingFiles = fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
        const newFileNames = new Set(items.map((st) => `${st.id}.md`))
        for (const file of existingFiles) {
            if (!newFileNames.has(file)) {
                fs.unlinkSync(path.join(dir, file))
            }
        }

        // Write all spec tests
        for (const st of items) {
            fs.writeFileSync(
                path.join(dir, `${st.id}.md`),
                serializeSpecTestMd(st),
                'utf-8'
            )
        }
    })

    // ── Lookup syntax units by keyword ──
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

    // ── Load groups ──
    ipcMain.handle(IPC.SPEC_TESTS_LOAD_GROUPS, async (event): Promise<SpecTestGroup[]> => {
        const ws = windowManager.getWorkspace(event.sender.id)
        if (!ws) return [DEFAULT_GROUP]
        const dir = getTestsDir(ws)
        const groupsFile = path.join(dir, 'groups.json')
        try {
            if (fs.existsSync(groupsFile)) {
                const content = fs.readFileSync(groupsFile, 'utf-8')
                const groups: SpecTestGroup[] = JSON.parse(content)
                // Ensure default group is always present
                if (!groups.some((g) => g.key === 'default')) {
                    groups.unshift(DEFAULT_GROUP)
                }
                return groups
            }
        } catch {
            // ignore
        }
        return [DEFAULT_GROUP]
    })

    // ── Save groups ──
    ipcMain.handle(IPC.SPEC_TESTS_SAVE_GROUPS, async (event, groups: SpecTestGroup[]) => {
        const ws = windowManager.getWorkspace(event.sender.id)
        if (!ws) throw new Error('No workspace selected')
        const dir = getTestsDir(ws)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        // Ensure default group
        if (!groups.some((g) => g.key === 'default')) {
            groups.unshift(DEFAULT_GROUP)
        }
        fs.writeFileSync(
            path.join(dir, 'groups.json'),
            JSON.stringify(groups, null, 2),
            'utf-8'
        )
    })

    // Link: search workspace test files for [id] patterns
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
