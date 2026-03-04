import { describe, test, expect, vi, beforeEach } from 'vitest'

// Mock the apiClient module before importing the function under test
vi.mock('../infrastructure/apiClient', () => ({
    trpcQuery: vi.fn(),
    trpcMutation: vi.fn(),
}))

// Mock windowManager (imported by mcpServer at module level)
vi.mock('../windowManager', () => ({
    windowManager: {
        getAllWindows: vi.fn(() => []),
        getWorkspace: vi.fn(() => null),
    },
}))

// Mock codescanStore (imported by mcpServer at module level)
vi.mock('../infrastructure/codescanStore', () => ({
    scanFile: vi.fn(() => null),
}))

// Mock MCP SDK (not needed for resolveProjectId tests)
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
    McpServer: vi.fn(),
}))
vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
    StreamableHTTPServerTransport: vi.fn(),
}))

import { _resolveProjectId as resolveProjectId } from '../mcpServer'
import { trpcQuery } from '../infrastructure/apiClient'

const mockTrpcQuery = vi.mocked(trpcQuery)

describe('[unit:019cb97e-74ca-7cd2-8aab-b2dc082cdbb3] Resolve git remote URL to project ID', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── Positive cases ──

    test('should return projectId when SSH URL matches exactly one project', async () => {
        const gitUrl = 'git@github.com:org/repo.git'
        mockTrpcQuery.mockResolvedValueOnce([
            { id: 'proj-001', teamId: 'team-1', name: 'My Repo', slug: 'github.com/org/repo' },
        ])

        const result = await resolveProjectId(gitUrl)

        expect(result).toEqual({ projectId: 'proj-001' })
        expect(mockTrpcQuery).toHaveBeenCalledWith(
            'project.findByGitRemote',
            { gitRemoteUrl: gitUrl },
        )
    })

    test('should return projectId when HTTPS URL matches exactly one project', async () => {
        const gitUrl = 'https://github.com/org/repo'
        mockTrpcQuery.mockResolvedValueOnce([
            { id: 'proj-002', teamId: 'team-1', name: 'My Repo', slug: 'github.com/org/repo' },
        ])

        const result = await resolveProjectId(gitUrl)

        expect(result).toEqual({ projectId: 'proj-002' })
    })

    test('should be idempotent — same input produces same result', async () => {
        const gitUrl = 'git@github.com:org/repo.git'
        const match = [{ id: 'proj-001', teamId: 'team-1', name: 'My Repo', slug: 'slug' }]
        mockTrpcQuery.mockResolvedValueOnce(match)
        mockTrpcQuery.mockResolvedValueOnce(match)

        const result1 = await resolveProjectId(gitUrl)
        const result2 = await resolveProjectId(gitUrl)

        expect(result1).toEqual(result2)
        expect(result1).toEqual({ projectId: 'proj-001' })
    })

    // ── Negative cases ──

    test('should return error with original URL when no project matches (empty array)', async () => {
        const gitUrl = 'git@github.com:unknown/repo.git'
        mockTrpcQuery.mockResolvedValueOnce([])

        const result = await resolveProjectId(gitUrl)

        expect(result).toHaveProperty('error')
        expect((result as { error: string }).error).toContain('No project found')
        expect((result as { error: string }).error).toContain(gitUrl)
    })

    test('should return error when trpcQuery returns null', async () => {
        const gitUrl = 'git@github.com:unknown/repo.git'
        mockTrpcQuery.mockResolvedValueOnce(null)

        const result = await resolveProjectId(gitUrl)

        expect(result).toHaveProperty('error')
        expect((result as { error: string }).error).toContain('No project found')
    })

    test('should return error listing all candidates when multiple projects match', async () => {
        const gitUrl = 'git@github.com:org/shared.git'
        mockTrpcQuery.mockResolvedValueOnce([
            { id: 'proj-A', teamId: 'team-alpha', name: 'Shared Alpha', slug: 'slug-a' },
            { id: 'proj-B', teamId: 'team-beta', name: 'Shared Beta', slug: 'slug-b' },
        ])

        const result = await resolveProjectId(gitUrl)

        expect(result).toHaveProperty('error')
        const error = (result as { error: string }).error
        expect(error).toContain('Multiple projects found')
        expect(error).toContain(gitUrl)
        // Must list each candidate's name, teamId, id
        expect(error).toContain('Shared Alpha')
        expect(error).toContain('team-alpha')
        expect(error).toContain('proj-A')
        expect(error).toContain('Shared Beta')
        expect(error).toContain('team-beta')
        expect(error).toContain('proj-B')
    })

    test('should return error wrapping Error.message when trpcQuery throws an Error', async () => {
        const gitUrl = 'git@github.com:org/repo.git'
        mockTrpcQuery.mockRejectedValueOnce(new Error('Network timeout'))

        const result = await resolveProjectId(gitUrl)

        expect(result).toHaveProperty('error')
        const error = (result as { error: string }).error
        expect(error).toContain('Failed to resolve project')
        expect(error).toContain('Network timeout')
    })

    test('should return error stringifying non-Error throw values', async () => {
        const gitUrl = 'git@github.com:org/repo.git'
        mockTrpcQuery.mockRejectedValueOnce('raw string error')

        const result = await resolveProjectId(gitUrl)

        expect(result).toHaveProperty('error')
        const error = (result as { error: string }).error
        expect(error).toContain('Failed to resolve project')
        expect(error).toContain('raw string error')
    })
})
