import { describe, test, expect, vi, beforeEach } from 'vitest'

// ── Mock codescanStore BEFORE import ──

const mockScanFile = vi.fn()

vi.mock('../infrastructure/codescanStore', () => ({
    scanFile: mockScanFile,
}))

// Suppress side-effect imports
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

// ── Import under test ──

const { _lookupUnits: lookupUnits } = await import('../mcpServer')

// ── Fixtures ──

const MOCK_UNITS = [
    { type: 'Function', name: 'computeHelper', startLine: 1, endLine: 10, contentHash: 'a' },
    { type: 'ArrowFunction', name: 'fetchData', startLine: 12, endLine: 20, contentHash: 'b' },
    { type: 'Class', name: 'MyClass', startLine: 22, endLine: 50, contentHash: 'c' },
    { type: 'Variable', name: 'helperConst', startLine: 52, endLine: 52, contentHash: 'd' },
    { type: 'Interface', name: 'UserProfile', startLine: 54, endLine: 60, contentHash: 'e' },
    { type: 'TypeAlias', name: 'ConfigType', startLine: 62, endLine: 65, contentHash: 'f' },
]

const WS = '/workspace'
const FILE = 'src/utils/helper.ts'

// ── Tests ──

describe('[unit:019cb97e-99fc-7c42-9a92-266d75de39e4] lookupUnits keyword-based syntax unit filtering', () => {
    beforeEach(() => {
        mockScanFile.mockReset()
        mockScanFile.mockReturnValue({ syntaxUnits: MOCK_UNITS })
    })

    // ── Positive: empty keyword returns all ──

    test('empty keyword returns all syntax units without filtering', () => {
        const result = lookupUnits(WS, FILE, '')
        expect(result).toEqual(MOCK_UNITS)
        expect(result).toHaveLength(6)
    })

    test('whitespace-only keyword returns all syntax units', () => {
        const result = lookupUnits(WS, FILE, '   ')
        expect(result).toEqual(MOCK_UNITS)
    })

    // ── Positive: name substring matching ──

    test('matches by exact name substring', () => {
        const result = lookupUnits(WS, FILE, 'MyClass')
        expect(result).toEqual([MOCK_UNITS[2]])
    })

    test('matches partial name substring across multiple units', () => {
        const result = lookupUnits(WS, FILE, 'helper')
        expect(result).toHaveLength(2)
        expect(result.map((u: any) => u.name)).toEqual(['computeHelper', 'helperConst'])
    })

    // ── Positive: case insensitivity ──

    test('matching is case-insensitive', () => {
        const result = lookupUnits(WS, FILE, 'myclass')
        expect(result).toEqual([MOCK_UNITS[2]])
    })

    test('mixed case keyword still matches', () => {
        const result = lookupUnits(WS, FILE, 'FETCHDATA')
        expect(result).toEqual([MOCK_UNITS[1]])
    })

    // ── Positive: type alias mapping ──

    test.each([
        { keyword: 'function', expectedNames: ['computeHelper', 'fetchData'], desc: 'function → Function + ArrowFunction' },
        { keyword: 'const', expectedNames: ['helperConst'], desc: 'const → Variable' },
        { keyword: 'let', expectedNames: ['helperConst'], desc: 'let → Variable' },
        { keyword: 'var', expectedNames: ['helperConst'], desc: 'var → Variable' },
        { keyword: 'class', expectedNames: ['MyClass'], desc: 'class → Class' },
        { keyword: 'interface', expectedNames: ['UserProfile'], desc: 'interface → Interface' },
        { keyword: 'type', expectedNames: ['ConfigType'], desc: 'type → TypeAlias' },
    ])('type alias "$desc"', ({ keyword, expectedNames }) => {
        const result = lookupUnits(WS, FILE, keyword)
        expect(result.map((u: any) => u.name)).toEqual(expectedNames)
    })

    // ── Positive: export alias (empty array = always match) ──

    test('export keyword matches all units (empty alias = always true)', () => {
        const result = lookupUnits(WS, FILE, 'export')
        expect(result).toEqual(MOCK_UNITS)
    })

    // ── Positive: multi-token AND intersection ──

    test('multi-token AND: "const helper" matches Variable with helper in name', () => {
        const result = lookupUnits(WS, FILE, 'const helper')
        expect(result).toHaveLength(1)
        expect(result[0].name).toBe('helperConst')
    })

    test('multi-token AND: "export helper" matches units with helper in name', () => {
        const result = lookupUnits(WS, FILE, 'export helper')
        expect(result).toHaveLength(2)
        expect(result.map((u: any) => u.name)).toEqual(['computeHelper', 'helperConst'])
    })

    // ── Negative: file not found ──

    test('returns empty array when file is not scanned', () => {
        mockScanFile.mockReturnValue(null)
        const result = lookupUnits(WS, 'nonexistent.ts', 'anything')
        expect(result).toEqual([])
    })

    // ── Negative: no match ──

    test('returns empty array when keyword matches nothing', () => {
        const result = lookupUnits(WS, FILE, 'nonexistent')
        expect(result).toEqual([])
    })

    // ── Negative: multi-token AND with no intersection ──

    test('multi-token AND with no intersection returns empty', () => {
        // "class" matches Class:MyClass, "function" matches Function/ArrowFunction
        // No unit satisfies BOTH
        const result = lookupUnits(WS, FILE, 'class function')
        expect(result).toEqual([])
    })

    test('multi-token AND where one token is unrecognized returns empty', () => {
        const result = lookupUnits(WS, FILE, 'function zzz')
        expect(result).toEqual([])
    })
})
