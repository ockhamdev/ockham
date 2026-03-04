/**
 * Ockham Desktop MCP Server
 *
 * Runs in the Electron main process. Provides:
 * - 3 local tools: scan workspace, lookup syntax units, get file source
 * - 6 proxied tools: list/submit via tRPC API (authenticated with session cookie)
 *
 * All project-related tools use git_remote_url instead of project_id.
 * Desktop resolves git_remote_url → project_id via tRPC findByGitRemote.
 *
 * Transport: Streamable HTTP at http://localhost:3100/mcp
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import * as http from 'http'
import { z } from 'zod'
import * as codescanStore from './infrastructure/codescanStore'
import { trpcQuery, trpcMutation } from './infrastructure/apiClient'
import { windowManager } from './windowManager'
import * as fs from 'fs'
import * as path from 'path'

// ── Helpers ───────────────────────────────────────────

function getWorkspacePath(): string | null {
    const wins = windowManager.getAllWindows()
    for (const win of wins) {
        const ws = windowManager.getWorkspace(win.webContents.id)
        if (ws) return ws
    }
    return null
}

/**
 * Resolve git_remote_url → projectId via tRPC.
 * Returns { projectId } on success, or { error } on failure/ambiguity.
 */
async function resolveProjectId(gitRemoteUrl: string): Promise<{ projectId: string } | { error: string }> {
    try {
        const matches = await trpcQuery<{ id: string; teamId: string; name: string; slug: string }[]>(
            'project.findByGitRemote',
            { gitRemoteUrl }
        )

        if (!matches || matches.length === 0) {
            return { error: `No project found for git remote "${gitRemoteUrl}". Please create a project in Ockham Desktop first and ensure its slug matches this git remote.` }
        }

        if (matches.length > 1) {
            const options = matches.map((m) => `  - ${m.name} (team: ${m.teamId}, id: ${m.id})`).join('\n')
            return { error: `Multiple projects found for git remote "${gitRemoteUrl}". Please ask the user to choose:\n${options}` }
        }

        return { projectId: matches[0].id }
    } catch (e) {
        return { error: `Failed to resolve project: ${e instanceof Error ? e.message : String(e)}` }
    }
}

const GIT_REMOTE_SCHEMA = z.string().describe('Git remote origin URL (e.g. "git@github.com:org/repo.git" or "https://github.com/org/repo")')

// Keyword-based syntax unit lookup (same logic as testsHandlers.ts)
function lookupUnits(workspace: string, filePath: string, keyword: string) {
    const fileEntry = codescanStore.scanFile(workspace, filePath)
    if (!fileEntry) return []

    const tokens = keyword.toLowerCase().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return fileEntry.syntaxUnits

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

// ── MCP Server ────────────────────────────────────────

const server = new McpServer({
    name: 'ockham-mcp-server',
    version: '1.0.0',
})

// ═══════════════════════════════════════════════════════
// Local Codescan Tools
// ═══════════════════════════════════════════════════════

server.registerTool(
    'ockham_scan_workspace',
    {
        title: 'Scan Workspace',
        description: `Scan the current workspace to extract all syntax units (functions, classes, interfaces, etc.) from every source file.

Returns the full scan result including per-file syntax units with type, name, filePath (relative to workspace root), line numbers, and content hash.

Use this to discover what code exists in the project before submitting test proposals.`,
        inputSchema: {},
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    async () => {
        const ws = getWorkspacePath()
        if (!ws) {
            return { content: [{ type: 'text' as const, text: 'Error: No workspace is open in Ockham Desktop' }] }
        }
        const result = codescanStore.executeScan(ws)
        const summary = {
            workspacePath: result.workspacePath,
            scannedAt: result.scannedAt,
            totalFiles: result.totalFiles,
            files: result.files.map((f) => ({
                filePath: f.filePath,
                totalLines: f.totalLines,
                coveragePercent: f.coveragePercent,
                syntaxUnitCount: f.syntaxUnits.length,
                syntaxUnits: f.syntaxUnits.map((u) => ({
                    type: u.type,
                    name: u.name,
                    startLine: u.startLine,
                    endLine: u.endLine,
                })),
            })),
        }
        return { content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }] }
    }
)

server.registerTool(
    'ockham_lookup_syntax_units',
    {
        title: 'Lookup Syntax Units',
        description: `Look up syntax units in a specific file by keyword.

The file_path must be relative to the workspace root (e.g. "src/utils/helper.ts").
The keyword can be a function/class/interface name or a type keyword like "function", "class", "interface".

Returns matching syntax units with type, name, filePath, line range, and content hash (sha1).

The returned filePath is the path you should use when submitting unit test proposals.`,
        inputSchema: {
            file_path: z.string().describe('File path relative to workspace root (e.g. "src/utils/helper.ts")'),
            keyword: z.string().default('').describe('Search keyword — function/class name, or type like "function", "class". Empty returns all units.'),
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    async ({ file_path, keyword }) => {
        const ws = getWorkspacePath()
        if (!ws) {
            return { content: [{ type: 'text' as const, text: 'Error: No workspace is open' }] }
        }
        const units = lookupUnits(ws, file_path, keyword)
        return { content: [{ type: 'text' as const, text: JSON.stringify(units, null, 2) }] }
    }
)

server.registerTool(
    'ockham_get_file_source',
    {
        title: 'Get File Source',
        description: `Read the source code of a file in the workspace.

The file_path must be relative to the workspace root (e.g. "src/utils/helper.ts").`,
        inputSchema: {
            file_path: z.string().describe('File path relative to workspace root'),
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    async ({ file_path }) => {
        const ws = getWorkspacePath()
        if (!ws) {
            return { content: [{ type: 'text' as const, text: 'Error: No workspace is open' }] }
        }
        try {
            const content = fs.readFileSync(path.join(ws, file_path), 'utf-8')
            return { content: [{ type: 'text' as const, text: content }] }
        } catch {
            return { content: [{ type: 'text' as const, text: `Error: File not found: ${file_path}` }] }
        }
    }
)

// ═══════════════════════════════════════════════════════
// Proxied tRPC Tools — use git_remote_url for project resolution
// ═══════════════════════════════════════════════════════

server.registerTool(
    'ockham_list_unit_tests',
    {
        title: 'List Unit Tests',
        description: `List all unit tests for a project. Returns array of test records with id, path, description, contentHash, linkedFilePath.`,
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ git_remote_url }) => {
        const resolved = await resolveProjectId(git_remote_url)
        if ('error' in resolved) return { content: [{ type: 'text' as const, text: resolved.error }] }
        try {
            const result = await trpcQuery('testCase.list', { projectId: resolved.projectId })
            return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
        } catch (e) {
            return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] }
        }
    }
)

server.registerTool(
    'ockham_list_spec_tests',
    {
        title: 'List Spec Tests',
        description: `List all spec/acceptance tests for a project. Returns array with id, title, description, groupId, linkedFilePath.`,
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ git_remote_url }) => {
        const resolved = await resolveProjectId(git_remote_url)
        if ('error' in resolved) return { content: [{ type: 'text' as const, text: resolved.error }] }
        try {
            const result = await trpcQuery('testCase.listSpecTests', { projectId: resolved.projectId })
            return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
        } catch (e) {
            return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] }
        }
    }
)

server.registerTool(
    'ockham_list_stories',
    {
        title: 'List Stories',
        description: `List all stories/user requirements for a project. Returns array with id, title, enrichedText, prompt.`,
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ git_remote_url }) => {
        const resolved = await resolveProjectId(git_remote_url)
        if ('error' in resolved) return { content: [{ type: 'text' as const, text: resolved.error }] }
        try {
            const result = await trpcQuery('story.list', { projectId: resolved.projectId })
            return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
        } catch (e) {
            return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] }
        }
    }
)

server.registerTool(
    'ockham_submit_unit_test_proposal',
    {
        title: 'Submit Unit Test Proposal',
        description: `Submit a unit test proposal for review.

IMPORTANT — path rules:
- "path" must be a file path relative to the workspace root (e.g. "src/utils/helper.ts")
- This should match the filePath from ockham_scan_workspace or ockham_lookup_syntax_units
- Use ockham_lookup_syntax_units to find the correct path before submitting`,
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            path: z.string().describe('File path relative to workspace root (e.g. "src/utils/helper.ts")'),
            description: z.string().describe('Description of what the test covers'),
            proposed_by: z.string().describe('Who is proposing (e.g. "claude")'),
            content_hash: z.string().default('').describe('Optional hash of test content'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ git_remote_url, path: testPath, description, proposed_by, content_hash }) => {
        const resolved = await resolveProjectId(git_remote_url)
        if ('error' in resolved) return { content: [{ type: 'text' as const, text: resolved.error }] }
        try {
            const result = await trpcMutation('testCase.createUnitTestProposal', {
                projectId: resolved.projectId,
                path: testPath,
                description,
                proposedBy: proposed_by,
                contentHash: content_hash,
            })
            return { content: [{ type: 'text' as const, text: `Unit test proposal submitted:\n${JSON.stringify(result, null, 2)}` }] }
        } catch (e) {
            return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] }
        }
    }
)

server.registerTool(
    'ockham_submit_spec_test_proposal',
    {
        title: 'Submit Spec Test Proposal',
        description: `Submit a spec test proposal for review.`,
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            title: z.string().min(1).describe('Title of the spec test'),
            description: z.string().default('').describe('Detailed specification'),
            proposed_by: z.string().describe('Who is proposing'),
            group_key: z.string().nullable().default(null).describe('Optional group key'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ git_remote_url, title, description, proposed_by, group_key }) => {
        const resolved = await resolveProjectId(git_remote_url)
        if ('error' in resolved) return { content: [{ type: 'text' as const, text: resolved.error }] }
        try {
            const result = await trpcMutation('testCase.createSpecTestProposal', {
                projectId: resolved.projectId,
                title,
                description,
                proposedBy: proposed_by,
                groupKey: group_key,
            })
            return { content: [{ type: 'text' as const, text: `Spec test proposal submitted:\n${JSON.stringify(result, null, 2)}` }] }
        } catch (e) {
            return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] }
        }
    }
)

server.registerTool(
    'ockham_submit_story_proposal',
    {
        title: 'Submit Story Proposal',
        description: `Submit a story/requirement proposal for review.`,
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            title: z.string().min(1).describe('Story title'),
            proposed_by: z.string().describe('Who is proposing'),
            enriched_text: z.string().default('').describe('Detailed description'),
            prompt: z.string().default('').describe('Prompt text'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ git_remote_url, title, proposed_by, enriched_text, prompt }) => {
        const resolved = await resolveProjectId(git_remote_url)
        if ('error' in resolved) return { content: [{ type: 'text' as const, text: resolved.error }] }
        try {
            const result = await trpcMutation('story.createProposal', {
                projectId: resolved.projectId,
                title,
                proposedBy: proposed_by,
                enrichedText: enriched_text,
                prompt,
            })
            return { content: [{ type: 'text' as const, text: `Story proposal submitted:\n${JSON.stringify(result, null, 2)}` }] }
        } catch (e) {
            return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] }
        }
    }
)

// ── Start ─────────────────────────────────────────────

const MCP_PORT = parseInt(process.env.OCKHAM_MCP_PORT || '3100', 10)
const MCP_PATH = '/mcp'

export async function startMcpServer(): Promise<void> {
    try {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // stateless mode
        })

        await server.connect(transport)

        const httpServer = http.createServer(async (req, res) => {
            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')

            if (req.method === 'OPTIONS') {
                res.writeHead(204)
                res.end()
                return
            }

            const url = new URL(req.url || '/', `http://localhost:${MCP_PORT}`)

            if (url.pathname === MCP_PATH) {
                await transport.handleRequest(req, res)
            } else if (url.pathname === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ status: 'ok', mcp: MCP_PATH }))
            } else {
                res.writeHead(404)
                res.end('Not found')
            }
        })

        httpServer.listen(MCP_PORT, () => {
            console.log(`[MCP] Ockham MCP server listening at http://localhost:${MCP_PORT}${MCP_PATH}`)
        })
    } catch (err) {
        console.error('[MCP] Failed to start MCP server:', err)
    }
}
