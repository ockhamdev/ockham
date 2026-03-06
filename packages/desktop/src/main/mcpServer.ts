/**
 * Ockham Desktop MCP Server
 *
 * Runs in the Electron main process. Provides:
 * - 1 local tool: lookup syntax units
 * - 16 proxied tools: CRUD via tRPC API + prompt generation (authenticated with session cookie)
 *
 * All project-related tools use git_remote_url instead of project_id.
 * Desktop resolves git_remote_url → project_id via tRPC findByGitRemote.
 *
 * Transport: Streamable HTTP at http://localhost:3100/mcp
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import * as http from 'http'
import * as path from 'path'
import * as fs from 'fs'
// randomUUID no longer needed — stateless transport doesn't generate session IDs
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


// ── MCP Server (tools registered per-session in registerAllTools below) ──

// ── Start ─────────────────────────────────────────────

const MCP_PORT = parseInt(process.env.OCKHAM_MCP_PORT || '3100', 10)
const MCP_PATH = '/mcp'

// Track active sessions: sessionId → transport
// const activeSessions = new Map<string, StreamableHTTPServerTransport>()

export async function startMcpServer(): Promise<void> {
    try {
        const httpServer = http.createServer(async (req, res) => {
            const url = new URL(req.url || '/', `http://localhost:${MCP_PORT}`)

            // CORS preflight — handle before anything else
            if (req.method === 'OPTIONS') {
                res.writeHead(204, {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version',
                })
                res.end()
                return
            }

            // Non-MCP routes
            if (url.pathname === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ status: 'ok', mcp: MCP_PATH }))
                return
            }

            if (url.pathname !== MCP_PATH) {
                res.writeHead(404)
                res.end('Not found')
                return
            }

            console.log(`[MCP] ${req.method} ${url.pathname}`)

            // MCP path — stateless: each request gets its own server + transport pair.
            // This avoids _transport race conditions in Server.connect() when handling
            // concurrent requests. The SDK reference implementation does the same.
            try {
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: undefined, // stateless — no session management
                    enableJsonResponse: true,      // return JSON instead of SSE for POST
                })

                const server = new McpServer({
                    name: 'ockham-mcp-server',
                    version: '1.0.0',
                })
                registerAllTools(server)

                // Clean up transport when response closes
                res.on('close', () => {
                    transport.close().catch(() => { })
                })

                await server.connect(transport)
                await transport.handleRequest(req, res)
            } catch (err) {
                console.error('[MCP] Error handling request:', err)
                if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' })
                    res.end('Internal Server Error')
                }
            }
        })

        httpServer.listen(MCP_PORT, () => {
            console.log(`[MCP] Ockham MCP server listening at http://localhost:${MCP_PORT}${MCP_PATH}`)
        })
    } catch (err) {
        console.error('[MCP] Failed to start MCP server:', err)
    }
}

/**
 * Register all MCP tools on a server instance.
 * Extracted so each new session gets its own server with all tools.
 */
function registerAllTools(srv: McpServer): void {
    // ── Local Codescan Tools ──
    srv.registerTool(
        'ockham_lookup_syntax_units',
        {
            title: 'Lookup Syntax Units',
            description: `Look up syntax units in a specific file by keyword.\n\nThe file_path must be relative to the workspace root (e.g. "src/utils/helper.ts").\nThe keyword can be a function/class/interface name or a type keyword like "function", "class", "interface".\n\nReturns matching syntax units with type, name, filePath, line range, and content hash (sha1).\n\nThe returned filePath is the path you should use when submitting unit test proposals.`,
            inputSchema: {
                workspace_path: z.string().describe('Absolute path to the workspace root directory'),
                file_path: z.string().describe('File path relative to workspace root (e.g. "src/utils/helper.ts")'),
                keyword: z.string().default('').describe('Search keyword — function/class name, or type like "function", "class". Empty returns all units.'),
            },
            annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        async ({ workspace_path, file_path, keyword }) => {
            const ws = workspace_path || getWorkspacePath()
            if (!ws) return { content: [{ type: 'text' as const, text: 'Error: workspace_path is required' }] }
            const units = lookupUnits(ws, file_path, keyword)
            return { content: [{ type: 'text' as const, text: JSON.stringify(units, null, 2) }] }
        }
    )

    // ── Team & Project Management Tools ──
    srv.registerTool(
        'ockham_list_teams',
        {
            title: 'List Teams',
            description: `List all teams/organizations the current user belongs to.\n\nReturns an array of teams with id, name, slug.\nUse this when the user has multiple teams and you need them to choose which team to create a project in.`,
            inputSchema: {},
            annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        async () => {
            try {
                const teams = await trpcQuery<{ id: string; name: string; slug: string }[]>('team.list', undefined)
                if (!teams || teams.length === 0) return { content: [{ type: 'text' as const, text: 'No teams found.' }] }
                return { content: [{ type: 'text' as const, text: JSON.stringify(teams, null, 2) }] }
            } catch (e) {
                return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] }
            }
        }
    )

    srv.registerTool(
        'ockham_create_project',
        {
            title: 'Create Project',
            description: `Create a project in Ockham by git remote URL.\n\nIf a project with the same slug already exists in the specified team, it will be returned instead of creating a duplicate.\n\nIf team_id is not provided, the project will be created under the user's default team.\nIf the user has multiple teams, use ockham_list_teams first to let them choose, then pass the chosen team_id here.\n\nThe project name is derived from the git remote URL (e.g. "github.com/org/repo" → "repo").`,
            inputSchema: {
                git_remote_url: GIT_REMOTE_SCHEMA,
                team_id: z.string().optional().describe('Team ID to create the project under. If omitted, uses the user\'s default team.'),
                name: z.string().optional().describe('Project name. If omitted, derived from the git remote URL (e.g. the repo name).'),
            },
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        async ({ git_remote_url, team_id, name: projectName }) => {
            try {
                const slug = git_remote_url.trim()
                    .replace(/^(ssh|git|https?):\/\//, '')
                    .replace(/^git@/, '')
                    .replace(/:(?!\/)/, '/')
                    .replace(/\.git$/, '')
                    .replace(/\/$/, '')
                    .replace(/^[^@]+@/, '')
                const derivedName = projectName || slug.split('/').pop() || slug
                let resolvedTeamId = team_id
                if (!resolvedTeamId) {
                    const defaultTeam = await trpcQuery<{ id: string }>('team.ensureTeam', undefined)
                    if (!defaultTeam) return { content: [{ type: 'text' as const, text: 'Error: Could not resolve default team.' }] }
                    resolvedTeamId = defaultTeam.id
                }
                const project = await trpcMutation('project.ensureBySlug', { teamId: resolvedTeamId, slug, name: derivedName })
                return { content: [{ type: 'text' as const, text: `Project ready:\n${JSON.stringify(project, null, 2)}` }] }
            } catch (e) {
                return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] }
            }
        }
    )

    // ── Proxied tRPC Tools ──
    srv.registerTool('ockham_list_unit_tests', {
        title: 'List Unit Tests',
        description: 'List all unit tests for a project. Returns array of test records with id, path, description, contentHash, linkedFilePath.',
        inputSchema: { git_remote_url: GIT_REMOTE_SCHEMA },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async ({ git_remote_url }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try { return { content: [{ type: 'text' as const, text: JSON.stringify(await trpcQuery('testCase.list', { projectId: r.projectId }), null, 2) }] } }
        catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    srv.registerTool('ockham_list_spec_tests', {
        title: 'List Spec Tests',
        description: 'List all spec/acceptance tests for a project. Returns array with id, title, description, groupId, linkedFilePath.',
        inputSchema: { git_remote_url: GIT_REMOTE_SCHEMA },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async ({ git_remote_url }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try { return { content: [{ type: 'text' as const, text: JSON.stringify(await trpcQuery('testCase.listSpecTests', { projectId: r.projectId }), null, 2) }] } }
        catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    srv.registerTool('ockham_list_stories', {
        title: 'List Stories',
        description: 'List all stories/user requirements for a project. Returns array with id, title, enrichedText, prompt.',
        inputSchema: { git_remote_url: GIT_REMOTE_SCHEMA },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async ({ git_remote_url }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try { return { content: [{ type: 'text' as const, text: JSON.stringify(await trpcQuery('story.list', { projectId: r.projectId }), null, 2) }] } }
        catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    // ── Test Generation Prompt Tools ──

    srv.registerTool('ockham_get_unit_test_prompt', {
        title: 'Get Unit Test Generation Prompt',
        description: `Generate a prompt for implementing a unit test from a proposal.\n\nGiven a unit test proposal ID, this tool fetches the proposal details, reads the target source file, and assembles a comprehensive prompt that an AI agent can use to write the actual test code.\n\nThe returned prompt includes:\n- Test requirements from the proposal description\n- Target file path and its syntax units\n- Source code of the function/class to test`,
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            proposal_id: z.string().describe('ID of the unit test proposal'),
            workspace_path: z.string().default('').describe('Absolute path to workspace root (auto-detected if empty)'),
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async ({ git_remote_url, proposal_id, workspace_path }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }

        try {
            // Fetch all proposals for the project and find the one we want
            const proposals = await trpcQuery<Array<{ id: string; path: string; description: string; proposedBy: string }>>('testCase.listUnitTestProposals', { projectId: r.projectId })
            const proposal = proposals.find(p => p.id === proposal_id)
            if (!proposal) return { content: [{ type: 'text' as const, text: `Error: Unit test proposal ${proposal_id} not found` }] }

            const ws = workspace_path || getWorkspacePath()
            let sourceSection = ''
            let unitsSection = ''

            if (ws) {
                // Get syntax units from target file
                const units = lookupUnits(ws, proposal.path, '')
                if (units.length > 0) {
                    unitsSection = `\n## Syntax Units in Target File\n\n${units.map((u: { type: string; name: string; startLine: number; endLine: number }) => `- ${u.type}: ${u.name} (lines ${u.startLine}-${u.endLine})`).join('\n')}\n`
                }

                // Read source file
                const fullPath = path.join(ws, proposal.path)
                if (fs.existsSync(fullPath)) {
                    const src = fs.readFileSync(fullPath, 'utf-8')
                    sourceSection = `\n## Source Code\n\n\`\`\`\n${src}\n\`\`\`\n`
                }
            }

            const prompt = `# Unit Test Generation Prompt

## Target File
\`${proposal.path}\`

## Test Requirements
${proposal.description}
${unitsSection}${sourceSection}
## Instructions
Write unit tests for the target file based on the requirements above.
- Use the project's existing test framework and conventions
- Cover all scenarios described in the requirements
- Include edge cases and error handling
- Each test should be independent and self-contained
`
            return { content: [{ type: 'text' as const, text: prompt }] }
        } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    srv.registerTool('ockham_get_spec_test_prompt', {
        title: 'Get Spec Test Generation Prompt',
        description: `Generate a prompt for implementing a spec/integration test from a proposal.\n\nGiven a spec test proposal ID, this tool fetches the proposal details (including referenced syntax units), reads the relevant source files, and assembles a comprehensive prompt for writing the actual test.\n\nThe returned prompt includes:\n- Test scenario and expected behavior\n- Referenced syntax units with source code\n- Group context (functional area in the system)`,
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            proposal_id: z.string().describe('ID of the spec test proposal'),
            workspace_path: z.string().default('').describe('Absolute path to workspace root (auto-detected if empty)'),
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async ({ git_remote_url, proposal_id, workspace_path }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }

        try {
            // Fetch all spec test proposals and find the one we want
            const proposals = await trpcQuery<Array<{ id: string; title: string; description: string; groupKey?: string; proposedBy: string }>>('testCase.listSpecTestProposals', { projectId: r.projectId })
            const proposal = proposals.find(p => p.id === proposal_id)
            if (!proposal) return { content: [{ type: 'text' as const, text: `Error: Spec test proposal ${proposal_id} not found` }] }

            const ws = workspace_path || getWorkspacePath()
            let referencedCode = ''

            // Parse referenced units from description (## Referenced Units section)
            if (ws && proposal.description) {
                const refMatch = proposal.description.match(/## Referenced Units\s*\n([\s\S]*?)(?=\n## |$)/)
                if (refMatch) {
                    const unitLines = refMatch[1].split('\n').filter(l => l.trim().startsWith('-'))
                    const filePaths = new Set<string>()
                    for (const line of unitLines) {
                        // Extract file path from "- name (type) in path/to/file.ts"
                        const m = line.match(/in\s+([\w/.@-]+\.\w+)/)
                        if (m) filePaths.add(m[1])
                    }

                    for (const fp of filePaths) {
                        const fullPath = path.join(ws, fp)
                        if (fs.existsSync(fullPath)) {
                            const src = fs.readFileSync(fullPath, 'utf-8')
                            referencedCode += `\n### \`${fp}\`\n\n\`\`\`\n${src}\n\`\`\`\n`
                        }
                    }
                }
            }

            const groupLine = proposal.groupKey ? `\n**Group:** \`${proposal.groupKey}\`\n` : ''

            const prompt = `# Spec Test Generation Prompt

## Test Scenario
**${proposal.title}**
${groupLine}
## Specification
${proposal.description}
${referencedCode ? `\n## Referenced Source Code\n${referencedCode}` : ''}
## Instructions
Write a spec/integration test based on the specification above.
- This test exercises multiple units working together
- Verify the expected behavior described in the specification
- Set up proper preconditions as described
- Test both success and failure paths
- Use the project's existing test framework and conventions
`
            return { content: [{ type: 'text' as const, text: prompt }] }
        } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    srv.registerTool('ockham_submit_unit_test_proposal', {
        title: 'Submit Unit Test Proposal',
        description: `Submit a unit test proposal for review.\n\nIMPORTANT — path rules:\n- "path" must be a file path relative to the workspace root PLUS a syntax unit keyword, separated by a space\n- Format: "<relative_file_path> <syntax_unit_keyword>"\n- Example: "src/utils/helper.ts computeHash" or "packages/web/src/backend/trpc.ts createTRPCContext"\n- Use ockham_lookup_syntax_units to find the correct file path and unit name before submitting`,
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            path: z.string().describe('File path + syntax unit keyword (e.g. "src/utils/helper.ts computeHash")'),
            description: z.string().describe('Description of what the test covers'),
            proposed_by: z.string().describe('Who is proposing (e.g. "claude")'),
            content_hash: z.string().default('').describe('Optional hash of test content'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    }, async ({ git_remote_url, path: testPath, description, proposed_by, content_hash }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try {
            const result = await trpcMutation('testCase.createUnitTestProposal', { projectId: r.projectId, path: testPath, description, proposedBy: proposed_by, contentHash: content_hash })
            return { content: [{ type: 'text' as const, text: `Unit test proposal submitted:\n${JSON.stringify(result, null, 2)}` }] }
        } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    srv.registerTool('ockham_submit_spec_test_proposal', {
        title: 'Submit Spec Test Proposal',
        description: `Submit a spec test proposal for review.

A spec test covers cross-cutting behavior: e2e tests, integration tests, or composite tests that exercise multiple code paths together.

IMPORTANT — before submitting, you MUST:

1. **Assign a group_key** that represents where this test sits in the system's functional structure.
   - Use dot-separated hierarchy, e.g. "auth.login", "billing.checkout", "api.projects.crud"
   - If the group doesn't exist yet, use ockham_lookup_syntax_units to understand the codebase structure and derive a meaningful key.

2. **Identify referenced syntax units** — the key functions, classes, or modules this test depends on.
   - Use ockham_lookup_syntax_units to find the relevant units first.
   - Include them in the description as a structured list, for example:
     "## Referenced Units\\n- computeHash (function) in src/utils/helper.ts computeHash\\n- AuthMiddleware (class) in src/middleware/auth.ts AuthMiddleware"

The description should contain:
- What the test verifies (expected behavior)
- Preconditions and test setup
- Referenced syntax units (as listed above)
- Why these units must work together`,
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            title: z.string().min(1).describe('Concise title describing the test scenario, e.g. "User login with expired token returns 401"'),
            description: z.string().default('').describe('Detailed specification including: expected behavior, preconditions, and a "## Referenced Units" section listing the syntax units (name, type, file path) this test depends on'),
            proposed_by: z.string().describe('Who is proposing'),
            group_key: z.string().nullable().default(null).describe('Dot-separated group key representing the functional area, e.g. "auth.login", "api.projects". Use ockham_lookup_syntax_units to understand the structure first.'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    }, async ({ git_remote_url, title, description, proposed_by, group_key }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try {
            const result = await trpcMutation('testCase.createSpecTestProposal', { projectId: r.projectId, title, description, proposedBy: proposed_by, groupKey: group_key })
            return { content: [{ type: 'text' as const, text: `Spec test proposal submitted:\n${JSON.stringify(result, null, 2)}` }] }
        } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    srv.registerTool('ockham_submit_story_proposal', {
        title: 'Submit Story Proposal',
        description: 'Submit a story/requirement proposal for review.',
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            title: z.string().min(1).describe('Story title'),
            proposed_by: z.string().describe('Who is proposing'),
            enriched_text: z.string().default('').describe('Detailed description'),
            prompt: z.string().default('').describe('Prompt text'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    }, async ({ git_remote_url, title, proposed_by, enriched_text, prompt }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try {
            const result = await trpcMutation('story.createProposal', { projectId: r.projectId, title, proposedBy: proposed_by, enrichedText: enriched_text, prompt })
            return { content: [{ type: 'text' as const, text: `Story proposal submitted:\n${JSON.stringify(result, null, 2)}` }] }
        } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    // ═══════════════════════════════════════════════════════
    // Update / Delete / Batch Delete Tools
    // ═══════════════════════════════════════════════════════

    // ── Unit Test Proposal CRUD ──

    srv.registerTool('ockham_update_unit_test_proposal', {
        title: 'Update Unit Test Proposal',
        description: 'Update an existing unit test proposal. Only provided fields will be changed.',
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            id: z.string().describe('ID of the unit test proposal to update'),
            path: z.string().optional().describe('New file path'),
            description: z.string().optional().describe('New description'),
            content_hash: z.string().optional().describe('New content hash'),
            implementation: z.string().optional().describe('Test implementation summary — set after writing the actual test code'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async ({ git_remote_url, id, path: p, description, content_hash, implementation }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try {
            const result = await trpcMutation('testCase.updateUnitTestProposalContent', { id, path: p, description, contentHash: content_hash, implementation })
            return { content: [{ type: 'text' as const, text: `Updated:\n${JSON.stringify(result, null, 2)}` }] }
        } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    srv.registerTool('ockham_delete_unit_test_proposal', {
        title: 'Delete Unit Test Proposal',
        description: 'Delete a single unit test proposal by ID.',
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            id: z.string().describe('ID of the unit test proposal to delete'),
        },
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    }, async ({ git_remote_url, id }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try {
            await trpcMutation('testCase.deleteUnitTestProposal', { id })
            return { content: [{ type: 'text' as const, text: `Deleted unit test proposal ${id}` }] }
        } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    srv.registerTool('ockham_batch_delete_unit_test_proposals', {
        title: 'Batch Delete Unit Test Proposals',
        description: 'Delete multiple unit test proposals by their IDs in a single operation.',
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            ids: z.array(z.string()).min(1).describe('Array of unit test proposal IDs to delete'),
        },
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    }, async ({ git_remote_url, ids }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try {
            await trpcMutation('testCase.batchDeleteUnitTestProposals', { ids })
            return { content: [{ type: 'text' as const, text: `Deleted ${ids.length} unit test proposal(s)` }] }
        } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    // ── Spec Test Proposal CRUD ──

    srv.registerTool('ockham_update_spec_test_proposal', {
        title: 'Update Spec Test Proposal',
        description: 'Update an existing spec test proposal. Only provided fields will be changed.',
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            id: z.string().describe('ID of the spec test proposal to update'),
            title: z.string().optional().describe('New title'),
            description: z.string().optional().describe('New description'),
            group_key: z.string().nullable().optional().describe('New group key'),
            implementation: z.string().optional().describe('Test implementation summary — set after writing the actual test code'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async ({ git_remote_url, id, title, description, group_key, implementation }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try {
            const result = await trpcMutation('testCase.updateSpecTestProposalContent', { id, title, description, groupKey: group_key, implementation })
            return { content: [{ type: 'text' as const, text: `Updated:\n${JSON.stringify(result, null, 2)}` }] }
        } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    srv.registerTool('ockham_delete_spec_test_proposal', {
        title: 'Delete Spec Test Proposal',
        description: 'Delete a single spec test proposal by ID.',
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            id: z.string().describe('ID of the spec test proposal to delete'),
        },
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    }, async ({ git_remote_url, id }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try {
            await trpcMutation('testCase.deleteSpecTestProposal', { id })
            return { content: [{ type: 'text' as const, text: `Deleted spec test proposal ${id}` }] }
        } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    srv.registerTool('ockham_batch_delete_spec_test_proposals', {
        title: 'Batch Delete Spec Test Proposals',
        description: 'Delete multiple spec test proposals by their IDs in a single operation.',
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            ids: z.array(z.string()).min(1).describe('Array of spec test proposal IDs to delete'),
        },
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    }, async ({ git_remote_url, ids }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try {
            await trpcMutation('testCase.batchDeleteSpecTestProposals', { ids })
            return { content: [{ type: 'text' as const, text: `Deleted ${ids.length} spec test proposal(s)` }] }
        } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    // ── Story Proposal CRUD ──

    srv.registerTool('ockham_update_story_proposal', {
        title: 'Update Story Proposal',
        description: 'Update an existing story/requirement proposal. Only provided fields will be changed.',
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            id: z.string().describe('ID of the story proposal to update'),
            title: z.string().optional().describe('New title'),
            enriched_text: z.string().optional().describe('New enriched text / detailed description'),
            prompt: z.string().optional().describe('New prompt text'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async ({ git_remote_url, id, title, enriched_text, prompt }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try {
            const result = await trpcMutation('story.updateProposalContent', { id, title, enrichedText: enriched_text, prompt })
            return { content: [{ type: 'text' as const, text: `Updated:\n${JSON.stringify(result, null, 2)}` }] }
        } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    srv.registerTool('ockham_delete_story_proposal', {
        title: 'Delete Story Proposal',
        description: 'Delete a single story/requirement proposal by ID.',
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            id: z.string().describe('ID of the story proposal to delete'),
        },
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    }, async ({ git_remote_url, id }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try {
            await trpcMutation('story.deleteProposal', { id })
            return { content: [{ type: 'text' as const, text: `Deleted story proposal ${id}` }] }
        } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })

    srv.registerTool('ockham_batch_delete_story_proposals', {
        title: 'Batch Delete Story Proposals',
        description: 'Delete multiple story/requirement proposals by their IDs in a single operation.',
        inputSchema: {
            git_remote_url: GIT_REMOTE_SCHEMA,
            ids: z.array(z.string()).min(1).describe('Array of story proposal IDs to delete'),
        },
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    }, async ({ git_remote_url, ids }) => {
        const r = await resolveProjectId(git_remote_url)
        if ('error' in r) return { content: [{ type: 'text' as const, text: r.error }] }
        try {
            await trpcMutation('story.batchDeleteProposals', { ids })
            return { content: [{ type: 'text' as const, text: `Deleted ${ids.length} story proposal(s)` }] }
        } catch (e) { return { content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] } }
    })
}

// ── Test-only exports ────────────────────────────────
export { resolveProjectId as _resolveProjectId, lookupUnits as _lookupUnits, registerAllTools as _registerAllTools }
