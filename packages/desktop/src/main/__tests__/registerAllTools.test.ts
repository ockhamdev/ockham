import { describe, test, expect, vi, beforeEach } from 'vitest'

// ── Mock dependencies BEFORE import ──

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
    McpServer: vi.fn().mockImplementation(function (this: any) {
        this.connect = vi.fn()
        this.registerTool = vi.fn()
    }),
}))
vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
    StreamableHTTPServerTransport: vi.fn(),
}))
vi.mock('../infrastructure/apiClient', () => ({
    trpcQuery: vi.fn(),
    trpcMutation: vi.fn(),
}))
vi.mock('../windowManager', () => ({
    windowManager: { getAllWindows: vi.fn(() => []), getWorkspace: vi.fn(() => null) },
}))
vi.mock('../infrastructure/codescanStore', () => ({
    scanFile: vi.fn(() => null),
}))

// ── Import ──

const { _registerAllTools: registerAllTools } = await import('../mcpServer')
const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js')

// ── Expected tools ──

const ALL_TOOL_NAMES = [
    // Local Codescan
    'ockham_lookup_syntax_units',
    // Team & Project
    'ockham_list_teams',
    'ockham_create_project',
    // Proxied tRPC reads
    'ockham_list_unit_tests',
    'ockham_list_spec_tests',
    'ockham_list_stories',
    // Prompt generation
    'ockham_get_unit_test_prompt',
    'ockham_get_spec_test_prompt',
    // Submit proposals
    'ockham_submit_unit_test_proposal',
    'ockham_submit_spec_test_proposal',
    'ockham_submit_story_proposal',
    // Unit test CRUD
    'ockham_update_unit_test_proposal',
    'ockham_delete_unit_test_proposal',
    'ockham_batch_delete_unit_test_proposals',
    // Spec test CRUD
    'ockham_update_spec_test_proposal',
    'ockham_delete_spec_test_proposal',
    'ockham_batch_delete_spec_test_proposals',
    // Story CRUD
    'ockham_update_story_proposal',
    'ockham_delete_story_proposal',
    'ockham_batch_delete_story_proposals',
] as const

const READ_ONLY_TOOLS = [
    'ockham_lookup_syntax_units',
    'ockham_list_teams',
    'ockham_list_unit_tests',
    'ockham_list_spec_tests',
    'ockham_list_stories',
    'ockham_get_unit_test_prompt',
    'ockham_get_spec_test_prompt',
]

const DESTRUCTIVE_TOOLS = [
    'ockham_delete_unit_test_proposal',
    'ockham_batch_delete_unit_test_proposals',
    'ockham_delete_spec_test_proposal',
    'ockham_batch_delete_spec_test_proposals',
    'ockham_delete_story_proposal',
    'ockham_batch_delete_story_proposals',
]

// ── Helpers ──

function createMockServer() {
    const srv = new (McpServer as any)({ name: 'test', version: '0.0.1' })
    return srv
}

function getRegisteredCalls(srv: any): Array<{ name: string; config: any; handler: Function }> {
    return srv.registerTool.mock.calls.map((c: any[]) => ({
        name: c[0],
        config: c[1],
        handler: c[2],
    }))
}

// ── Tests ──

describe('[unit:019cc0f2-3e14-7b6e-8cbb-f1b3bbe07361] registerAllTools registers complete MCP tool set with correct metadata', () => {
    let srv: any
    let calls: ReturnType<typeof getRegisteredCalls>

    beforeEach(() => {
        srv = createMockServer()
        registerAllTools(srv)
        calls = getRegisteredCalls(srv)
    })

    // ── Tool count ──

    test('registers exactly 20 tools', () => {
        expect(srv.registerTool).toHaveBeenCalledTimes(20)
    })

    // ── All tool names present ──

    test.each(ALL_TOOL_NAMES.map(n => [n]))('registers tool "%s"', (name) => {
        const found = calls.find(c => c.name === name)
        expect(found).toBeDefined()
    })

    // ── No duplicate names ──

    test('all tool names are unique', () => {
        const names = calls.map(c => c.name)
        expect(new Set(names).size).toBe(names.length)
    })

    // ── Each tool has a handler function ──

    test('every registered tool has a handler function as 3rd argument', () => {
        for (const call of calls) {
            expect(typeof call.handler).toBe('function')
        }
    })

    // ── Each tool has title and description ──

    test('every registered tool has title and description', () => {
        for (const call of calls) {
            expect(call.config.title).toBeTruthy()
            expect(typeof call.config.title).toBe('string')
            expect(call.config.description).toBeTruthy()
            expect(typeof call.config.description).toBe('string')
        }
    })

    // ── Read-only annotation ──

    test.each(READ_ONLY_TOOLS.map(n => [n]))('"%s" has readOnlyHint: true', (name) => {
        const call = calls.find(c => c.name === name)!
        expect(call.config.annotations.readOnlyHint).toBe(true)
    })

    // ── Destructive annotation ──

    test.each(DESTRUCTIVE_TOOLS.map(n => [n]))('"%s" has destructiveHint: true', (name) => {
        const call = calls.find(c => c.name === name)!
        expect(call.config.annotations.destructiveHint).toBe(true)
    })

    // ── Non-destructive tools ──

    test('non-delete tools have destructiveHint: false', () => {
        const nonDestructive = calls.filter(c => !DESTRUCTIVE_TOOLS.includes(c.name))
        for (const call of nonDestructive) {
            expect(call.config.annotations.destructiveHint).toBe(false)
        }
    })

    // ── Idempotency: calling twice doubles registrations ──

    test('calling registerAllTools twice registers 40 tools total', () => {
        registerAllTools(srv) // second call
        expect(srv.registerTool).toHaveBeenCalledTimes(40)
    })

    // ── inputSchema: git_remote_url presence ──

    test('tools requiring git_remote_url have it in inputSchema', () => {
        const toolsWithGitRemote = calls.filter(c =>
            c.name !== 'ockham_lookup_syntax_units' && c.name !== 'ockham_list_teams'
        )
        for (const call of toolsWithGitRemote) {
            expect(call.config.inputSchema).toHaveProperty('git_remote_url')
        }
    })

    test('ockham_lookup_syntax_units does NOT have git_remote_url', () => {
        const call = calls.find(c => c.name === 'ockham_lookup_syntax_units')!
        expect(call.config.inputSchema).not.toHaveProperty('git_remote_url')
        expect(call.config.inputSchema).toHaveProperty('workspace_path')
        expect(call.config.inputSchema).toHaveProperty('file_path')
    })

    test('ockham_list_teams has empty inputSchema', () => {
        const call = calls.find(c => c.name === 'ockham_list_teams')!
        expect(Object.keys(call.config.inputSchema)).toHaveLength(0)
    })
})
