import { describe, test, expect, vi, beforeAll, beforeEach } from 'vitest'
import * as http from 'http'

// ── Mock heavy dependencies BEFORE import ──

const mockHandleRequest = vi.fn(async (_req: http.IncomingMessage, res: http.ServerResponse) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ jsonrpc: '2.0', result: {}, id: 1 }))
})
const mockConnect = vi.fn()
const mockClose = vi.fn().mockResolvedValue(undefined)

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
    McpServer: vi.fn().mockImplementation(function (this: any) {
        this.connect = mockConnect
        this.registerTool = vi.fn()
    }),
}))

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
    StreamableHTTPServerTransport: vi.fn().mockImplementation(function (this: any) {
        this.sessionId = undefined // stateless
        this.handleRequest = mockHandleRequest
        this.close = mockClose
        this.onclose = null
    }),
}))

vi.mock('../infrastructure/apiClient', () => ({
    trpcQuery: vi.fn(),
    trpcMutation: vi.fn(),
}))

vi.mock('../windowManager', () => ({
    windowManager: {
        getAllWindows: vi.fn(() => []),
        getWorkspace: vi.fn(() => null),
    },
}))

vi.mock('../infrastructure/codescanStore', () => ({
    scanFile: vi.fn(() => null),
}))

// ── Test helpers ──

function makeRequest(port: number, options: {
    method: string
    path: string
    headers?: Record<string, string>
    body?: string
}): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port,
            method: options.method,
            path: options.path,
            headers: {
                ...(options.headers || {}),
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            },
        }, (res) => {
            let data = ''
            res.on('data', (chunk) => { data += chunk })
            res.on('end', () => {
                resolve({ status: res.statusCode || 0, headers: res.headers, body: data })
            })
        })
        req.on('error', reject)
        if (options.body) req.write(options.body)
        req.end()
    })
}

// ── Tests ──

const TEST_PORT = 39876

describe('[unit:019cb97e-9a40-7871-905a-258713a80bee] MCP HTTP server routing and session management', { timeout: 5000 }, () => {
    let startMcpServer: () => Promise<void>

    beforeAll(async () => {
        process.env.OCKHAM_MCP_PORT = String(TEST_PORT)
        const mod = await import('../mcpServer')
        startMcpServer = mod.startMcpServer
        await startMcpServer()
        await new Promise((r) => setTimeout(r, 100))
    })

    beforeEach(() => {
        mockHandleRequest.mockClear()
        mockConnect.mockClear()
    })

    // ── CORS ──

    test('OPTIONS /mcp returns 204 with correct CORS headers', async () => {
        const res = await makeRequest(TEST_PORT, { method: 'OPTIONS', path: '/mcp' })

        expect(res.status).toBe(204)
        expect(res.headers['access-control-allow-origin']).toBe('*')
        expect(res.headers['access-control-allow-methods']).toContain('POST')
        expect(res.headers['access-control-allow-methods']).toContain('OPTIONS')
        expect(res.headers['access-control-allow-headers']).toContain('Content-Type')
        expect(res.headers['access-control-allow-headers']).toContain('Mcp-Session-Id')
    })

    test('OPTIONS on non-MCP path also returns 204 (CORS handled first)', async () => {
        const res = await makeRequest(TEST_PORT, { method: 'OPTIONS', path: '/other' })

        expect(res.status).toBe(204)
        expect(res.headers['access-control-allow-origin']).toBe('*')
    })

    // ── Health check ──

    test('GET /health returns 200 with status ok', async () => {
        const res = await makeRequest(TEST_PORT, { method: 'GET', path: '/health' })

        expect(res.status).toBe(200)
        const body = JSON.parse(res.body)
        expect(body.status).toBe('ok')
        expect(body.mcp).toBe('/mcp')
    })

    // ── Non-MCP routes ──

    test('POST /other-path returns 404', async () => {
        const res = await makeRequest(TEST_PORT, { method: 'POST', path: '/other-path' })

        expect(res.status).toBe(404)
        expect(res.body).toContain('Not found')
    })

    test('GET /nonexistent returns 404', async () => {
        const res = await makeRequest(TEST_PORT, { method: 'GET', path: '/nonexistent' })

        expect(res.status).toBe(404)
    })

    // ── MCP path routing (stateless) ──

    test('POST /mcp creates stateless transport and delegates to handleRequest', async () => {
        const res = await makeRequest(TEST_PORT, {
            method: 'POST',
            path: '/mcp',
            headers: { 'Accept': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'initialize',
                params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '0.1' } },
                id: 1,
            }),
        })

        expect(mockConnect).toHaveBeenCalled()
        expect(mockHandleRequest).toHaveBeenCalled()
        expect(res.status).toBe(200)
    })

    test('POST /mcp works for tools/list (stateless — no session needed)', async () => {
        mockHandleRequest.mockClear()
        mockConnect.mockClear()
        // Restore default implementation in case previous test used mockImplementationOnce
        mockHandleRequest.mockImplementation(async (_req: http.IncomingMessage, res: http.ServerResponse) => {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ jsonrpc: '2.0', result: {}, id: 2 }))
        })

        const res = await makeRequest(TEST_PORT, {
            method: 'POST',
            path: '/mcp',
            headers: { 'Accept': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 2 }),
        })

        expect(mockHandleRequest).toHaveBeenCalled()
        expect(res.status).toBe(200)
    })

    test('GET /mcp delegates to transport (SSE stream support)', async () => {
        mockHandleRequest.mockClear()
        const res = await makeRequest(TEST_PORT, {
            method: 'GET',
            path: '/mcp',
            headers: { 'Accept': 'text/event-stream' },
        })

        // Transport handleRequest is called for GET
        expect(mockHandleRequest).toHaveBeenCalled()
        expect(res.status).toBe(200)
    })

    test('DELETE /mcp delegates to transport', async () => {
        mockHandleRequest.mockClear()
        const res = await makeRequest(TEST_PORT, { method: 'DELETE', path: '/mcp' })

        expect(mockHandleRequest).toHaveBeenCalled()
        expect(res.status).toBe(200)
    })

    // ── Error handling ──

    test('returns 500 when transport.handleRequest throws', async () => {
        mockHandleRequest.mockImplementationOnce(async () => {
            throw new Error('Transport error')
        })

        const res = await makeRequest(TEST_PORT, {
            method: 'POST',
            path: '/mcp',
            headers: { 'Accept': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 3 }),
        })

        expect(res.status).toBe(500)
        expect(res.body).toContain('Internal Server Error')
    })
})
