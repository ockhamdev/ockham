import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
    Button,
    Input,
    Typography,
    Table,
    Space,
    Drawer,
    Modal,
    Form,
    message,
    Empty,
    Tag,
    Popconfirm,
    Spin,
    Tooltip,
} from 'antd'

const { TextArea } = Input
import {
    PlusOutlined,
    DeleteOutlined,
    EnterOutlined,
    CloseOutlined,
    WarningOutlined,
    EditOutlined,
    ThunderboltOutlined,
    SyncOutlined,
    CheckCircleOutlined,
    MinusCircleOutlined,
    FileOutlined,
} from '@ant-design/icons'
import type { TestCase, SyntaxUnit } from '@ockham/shared'

const { Title, Text } = Typography

declare global {
    interface Window {
        testsApi: {
            load(): Promise<TestCase[]>
            save(items: TestCase[]): Promise<void>
            lookupUnit(filePath: string, keyword: string): Promise<SyntaxUnit[]>
            sync(testIds: string[]): Promise<Record<string, { filePath: string; line: number }>>
        }
        specTestsApi: {
            load(): Promise<TestCase[]>
            save(items: TestCase[]): Promise<void>
            lookupUnit(filePath: string, keyword: string): Promise<SyntaxUnit[]>
        }
    }
}

// ── Compute SHA-1 hash ──
async function computeSha1(text: string): Promise<string> {
    const data = new TextEncoder().encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ── Compute SHA-1 hash of text with all whitespace removed ──
async function computeStrippedHash(text: string): Promise<string> {
    return computeSha1(text.replace(/\s/g, ''))
}

// ── Parse path into filePath and keyword ──
function parsePath(p: string): { filePath: string; keyword: string } {
    const idx = p.indexOf(' ')
    if (idx === -1) return { filePath: p, keyword: '' }
    return { filePath: p.substring(0, idx), keyword: p.substring(idx + 1) }
}

// ── Copyable cell with tooltip ──
function CopyableCell({ value, fontSize = 12 }: { value: string; fontSize?: number }) {
    return (
        <Tooltip
            title={
                <div style={{ maxWidth: 400, wordBreak: 'break-all' }}>
                    <div style={{ marginBottom: 6, fontFamily: 'monospace', fontSize: 12 }}>{value}</div>
                    <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                            navigator.clipboard.writeText(value)
                            message.success('Copied')
                        }}
                    >
                        Copy
                    </Button>
                </div>
            }
        >
            <Text
                code
                style={{
                    fontSize,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    maxWidth: '100%',
                    cursor: 'pointer',
                }}
            >
                {value}
            </Text>
        </Tooltip>
    )
}

// ── Test Drawer (Create / Edit) ────────────────────────
function TestDrawer({
    open,
    onCancel,
    onSave,
    unit,
    keyword,
    mode,
    editingTest,
}: {
    open: boolean
    onCancel: () => void
    onSave: (tc: TestCase) => void
    unit: SyntaxUnit
    keyword: string
    mode: 'create' | 'edit'
    editingTest?: TestCase | null
}) {
    // Pre-fill description when drawer opens
    const initialDescription = mode === 'edit' && editingTest ? editingTest.description : ''
    const [description, setDescription] = useState(initialDescription)
    const [fileSource, setFileSource] = useState<string | null>(null)
    const [strippedHash, setStrippedHash] = useState('')
    const highlightRef = useRef<HTMLTableRowElement>(null)

    // Reset description when drawer opens
    useEffect(() => {
        if (open) {
            setDescription(mode === 'edit' && editingTest ? editingTest.description : '')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    // Fetch file source when drawer opens
    useEffect(() => {
        if (!open || !unit) return
        let cancelled = false
        window.codescanApi
            .getFileSource(unit.filePath)
            .then((src) => {
                if (cancelled) return
                setFileSource(src)
                if (src) {
                    const lines = src.split('\n')
                    const unitLines = lines.slice(unit.startLine - 1, unit.endLine)
                    const unitText = unitLines.join('\n')
                    computeStrippedHash(unitText).then((h) => {
                        if (!cancelled) setStrippedHash(h)
                    })
                }
            })
            .catch(() => {
                if (!cancelled) setFileSource(null)
            })
        return () => { cancelled = true }
    }, [open, unit])

    // Scroll highlighted area into view
    useEffect(() => {
        if (fileSource && highlightRef.current) {
            setTimeout(() => {
                highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
        }
    }, [fileSource])

    const handleSave = useCallback(async () => {
        const testPath = `${unit.filePath} ${keyword}`
        const id = await computeSha1(testPath)
        const tc: TestCase = {
            id,
            path: testPath,
            contentHash: strippedHash,
            description: description.trim() || `Test for ${keyword}`,
            createdAt: editingTest?.createdAt || new Date().toISOString(),
        }
        onSave(tc)
        setDescription('')
    }, [unit, keyword, strippedHash, description, onSave, editingTest])

    const handleCancel = useCallback(() => {
        setDescription('')
        onCancel()
    }, [onCancel])

    const sourceLines = fileSource?.split('\n') ?? []

    return (
        <Drawer
            title={mode === 'edit' ? 'Edit Test' : 'Create Test'}
            open={open}
            onClose={handleCancel}
            width="90vw"
            footer={
                <div style={{ textAlign: 'right' }}>
                    <Button onClick={handleCancel} style={{ marginRight: 8 }}>Cancel</Button>
                    <Button type="primary" onClick={handleSave}>
                        {mode === 'edit' ? 'Save' : 'Create'}
                    </Button>
                </div>
            }
        >
            <div style={{ display: 'flex', gap: 24, height: '100%' }}>
                {/* Left: Source code viewer */}
                <div
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        background: 'var(--ant-color-bg-layout)',
                        borderRadius: 8,
                        border: '1px solid var(--ant-color-border)',
                        fontFamily: 'monospace',
                        fontSize: 13,
                        lineHeight: 1.6,
                        padding: 0,
                    }}
                >
                    {fileSource === null ? (
                        <div style={{ padding: 24, textAlign: 'center' }}>
                            <Spin size="small" />
                            <Text type="secondary" style={{ marginLeft: 8 }}>Loading source...</Text>
                        </div>
                    ) : (
                        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                            <tbody>
                                {sourceLines.map((lineText, idx) => {
                                    const lineNum = idx + 1
                                    const isHighlighted =
                                        lineNum >= unit.startLine && lineNum <= unit.endLine
                                    return (
                                        <tr
                                            key={lineNum}
                                            ref={lineNum === unit.startLine ? highlightRef : undefined}
                                            style={{
                                                background: isHighlighted
                                                    ? 'rgba(22, 119, 255, 0.12)'
                                                    : 'transparent',
                                            }}
                                        >
                                            <td
                                                style={{
                                                    padding: '0 12px 0 16px',
                                                    textAlign: 'right',
                                                    color: 'var(--ant-color-text-quaternary)',
                                                    userSelect: 'none',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: 12,
                                                    width: 1,
                                                    borderRight: isHighlighted
                                                        ? '3px solid var(--ant-color-primary)'
                                                        : '3px solid transparent',
                                                }}
                                            >
                                                {lineNum}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '0 16px',
                                                    whiteSpace: 'pre',
                                                }}
                                            >
                                                {lineText}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Right: Form */}
                <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                    <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        {/* Keyword (read-only) */}
                        <Form.Item label="Keyword">
                            <Input
                                value={keyword}
                                readOnly
                                style={{ fontFamily: 'monospace', fontSize: 13 }}
                            />
                        </Form.Item>

                        {/* Type (read-only) */}
                        <Form.Item label="Type">
                            <Input
                                value={unit.type}
                                readOnly
                                style={{ fontSize: 13 }}
                            />
                        </Form.Item>

                        {/* Content Hash (read-only) */}
                        <Form.Item label="Content Hash">
                            <Input
                                value={strippedHash || 'Computing...'}
                                readOnly
                                style={{ fontFamily: 'monospace', fontSize: 12 }}
                            />
                        </Form.Item>

                        {/* Description */}
                        <Form.Item label="Description" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
                            <TextArea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What should this test verify?"
                                style={{ flex: 1, resize: 'none' }}
                            />
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </Drawer>
    )
}

// ── Main TestsPage ────────────────────────────────────
type TestCategory = 'unit' | 'spec'

function getCategoryConfig(category: TestCategory) {
    const configs = {
        unit: { title: 'Unit Tests', api: window.testsApi },
        spec: { title: 'Spec Tests', api: window.specTestsApi },
    }
    return configs[category]
}

function TestsPage({ category }: { category: TestCategory }) {
    const { title: pageTitle, api } = getCategoryConfig(category)
    const [tests, setTests] = useState<TestCase[]>([])
    const [drawerOpen, setDrawerOpen] = useState(false)

    // Inline input state
    const [showInput, setShowInput] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [inputError, setInputError] = useState('')
    const [lookingUp, setLookingUp] = useState(false)
    const inputRef = useRef<ReturnType<typeof Input>>(null)

    // Pre-looked-up unit for drawer
    const [pendingUnit, setPendingUnit] = useState<SyntaxUnit | null>(null)
    const [pendingFilePath, setPendingFilePath] = useState('')
    const [pendingKeyword, setPendingKeyword] = useState('')

    // Drawer mode (create vs edit)
    const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create')
    const [editingTest, setEditingTest] = useState<TestCase | null>(null)

    // Multi-match selection modal
    const [matchCandidates, setMatchCandidates] = useState<SyntaxUnit[]>([])
    const [showMatchModal, setShowMatchModal] = useState(false)

    // Sync state
    const [syncResults, setSyncResults] = useState<Record<string, { filePath: string; line: number }>>({})
    const [syncing, setSyncing] = useState(false)

    const handleSync = useCallback(async () => {
        // sync is only available on testsApi (unit tests)
        const syncFn = (api as { sync?: (ids: string[]) => Promise<Record<string, { filePath: string; line: number }>> }).sync
        if (!syncFn) {
            message.warning('Sync is not supported for this category')
            return
        }
        setSyncing(true)
        try {
            const ids = tests.map((t) => t.id)
            const results = await syncFn(ids)
            setSyncResults(results)
            const matched = Object.keys(results).length
            message.success(`Sync complete: ${matched}/${ids.length} matched`)
        } catch {
            message.error('Sync failed')
        }
        setSyncing(false)
    }, [tests, api])

    // Load persisted test cases on mount
    useEffect(() => {
        api.load().then((items) => {
            if (items?.length) setTests(items)
        })
    }, [api])

    // Auto-focus input when shown
    useEffect(() => {
        if (showInput) {
            setTimeout(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (inputRef.current as any)?.focus?.()
            }, 50)
        }
    }, [showInput])

    const handleNewTest = useCallback(() => {
        setShowInput(true)
        setInputValue('')
        setInputError('')
    }, [])

    const handleInputCancel = useCallback(() => {
        setShowInput(false)
        setInputValue('')
        setInputError('')
    }, [])

    const openDrawerWithUnit = useCallback((unit: SyntaxUnit, filePath: string, keyword: string) => {
        setPendingUnit(unit)
        setPendingFilePath(filePath)
        setPendingKeyword(keyword)
        setDrawerMode('create')
        setEditingTest(null)
        setDrawerOpen(true)
        setShowInput(false)
        setInputValue('')
    }, [])

    const handleInputConfirm = useCallback(async () => {
        const value = inputValue.trim()
        if (!value) {
            setInputError('请输入 path keyword，如 src/App.tsx menuItems')
            return
        }

        // Parse: first token is path, rest is keyword
        const spaceIdx = value.indexOf(' ')
        if (spaceIdx === -1) {
            setInputError('格式：path keyword，如 src/App.tsx menuItems')
            return
        }

        const filePath = value.substring(0, spaceIdx)
        const keyword = value.substring(spaceIdx + 1).trim()
        if (!keyword) {
            setInputError('请输入关键字，如 src/App.tsx menuItems')
            return
        }

        setLookingUp(true)
        setInputError('')

        try {
            const units = await api.lookupUnit(filePath, keyword)
            if (units.length === 0) {
                setInputError(`未找到匹配 "${keyword}" 的语法单元`)
            } else if (units.length === 1) {
                // Exact match — open drawer directly
                openDrawerWithUnit(units[0], filePath, keyword)
            } else {
                // Multiple matches — show selection
                setMatchCandidates(units)
                setPendingFilePath(filePath)
                setPendingKeyword(keyword)
                setShowMatchModal(true)
            }
        } catch (err) {
            setInputError(err instanceof Error ? err.message : 'Lookup failed')
        }
        setLookingUp(false)
    }, [inputValue, openDrawerWithUnit, api])

    const handleSelectMatch = useCallback((unit: SyntaxUnit) => {
        setShowMatchModal(false)
        setMatchCandidates([])
        openDrawerWithUnit(unit, pendingFilePath, pendingKeyword)
    }, [pendingFilePath, pendingKeyword, openDrawerWithUnit])

    const handleSaveFromDrawer = useCallback(
        (tc: TestCase) => {
            let updated: TestCase[]
            if (drawerMode === 'edit') {
                updated = tests.map((t) => (t.id === tc.id ? tc : t))
            } else {
                updated = [...tests, tc]
            }
            setTests(updated)
            api.save(updated)
            setDrawerOpen(false)
            setPendingUnit(null)
            setEditingTest(null)
            message.success(drawerMode === 'edit' ? 'Test updated' : `Test created: ${parsePath(tc.path).keyword}`)
        },
        [tests, api, drawerMode]
    )

    const handleEdit = useCallback((tc: TestCase) => {
        // For edit, we need the syntax unit — look it up from the test's path
        const { filePath, keyword: kw } = parsePath(tc.path)
        setEditingTest(tc)
        setDrawerMode('edit')
        setPendingKeyword(kw)
        // Lookup the syntax unit to show source code in the drawer
        api.lookupUnit(filePath, kw).then((units) => {
            if (units.length > 0) {
                setPendingUnit(units[0])
                setPendingFilePath(filePath)
                setDrawerOpen(true)
            } else {
                message.error('Could not find syntax unit for this test')
                setEditingTest(null)
            }
        })
    }, [api])

    const handleDelete = useCallback(
        (id: string) => {
            const updated = tests.filter((t) => t.id !== id)
            setTests(updated)
            api.save(updated)
        },
        [tests, api]
    )

    // ── Generate prompt state ──
    const [promptText, setPromptText] = useState('')
    const [showPromptModal, setShowPromptModal] = useState(false)
    const [generatingPrompt, setGeneratingPrompt] = useState<string | null>(null)
    const [viewTestFile, setViewTestFile] = useState<{ path: string; line: number; source: string } | null>(null)

    const handleGeneratePrompt = useCallback(async (tc: TestCase) => {
        setGeneratingPrompt(tc.id)
        const { filePath, keyword: kw } = parsePath(tc.path)
        try {
            // Look up syntax unit to get source code
            const units = await api.lookupUnit(filePath, kw)
            let sourceSnippet = '// Source code not available'
            if (units.length > 0) {
                const unit = units[0]
                try {
                    const src = await window.codescanApi.getFileSource(unit.filePath)
                    if (src) {
                        const lines = src.split('\n')
                        sourceSnippet = lines.slice(unit.startLine - 1, unit.endLine).join('\n')
                    }
                } catch {
                    // ignore
                }
            }

            const prompt = `## Unit Test Generation

Please write a unit test for the following code using **Vitest** framework.

### Test Metadata
- **Test ID**: \`${tc.id}\`
- **File Path**: \`${filePath}\`
- **Keyword**: \`${kw}\`

### Test Description
${tc.description}

### Implementation Source
\`\`\`typescript
${sourceSnippet}
\`\`\`

### Requirements
1. Use \`vitest\` as the test framework (\`describe\`, \`test\`, \`expect\`)
2. The \`describe\` block description MUST use format: \`[${tc.id}] <descriptive name>\`
   - The ID prefix \`[${tc.id}]\` is mandatory for linking test results back to this test case
   - Generate a clear, descriptive name based on the keyword \`${kw}\` (do NOT just use the keyword literally)
3. Use \`test()\` for each individual test case inside the \`describe\` block
4. Example structure:
\`\`\`typescript
describe('[${tc.id}] <descriptive name based on ${kw}>', () => {
  test('should ...', () => {
    // ...
  })
  test('should handle edge case', () => {
    // ...
  })
})
\`\`\`
5. Write test cases that verify the behavior described above
6. Use \`test()\` for unique individual cases; use \`test.each()\` for parameterized/data-driven scenarios with multiple input-output pairs
7. Mock external dependencies as needed
8. Cover edge cases and error handling
9. Do NOT write the test code immediately. First propose the test logic and cases, then wait for user confirmation before writing the actual test implementation
`
            setPromptText(prompt)
            setShowPromptModal(true)
        } catch {
            message.error('Failed to generate prompt')
        }
        setGeneratingPrompt(null)
    }, [api])

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: '10%',
            render: (id: string) => <CopyableCell value={id} fontSize={11} />,
        },
        {
            title: 'Path',
            dataIndex: 'path',
            key: 'path',
            width: '25%',
            render: (p: string) => <CopyableCell value={p} />,
        },
        {
            title: 'Content Hash',
            dataIndex: 'contentHash',
            key: 'contentHash',
            width: '10%',
            render: (h: string) => h ? <CopyableCell value={h} fontSize={11} /> : <Text type="secondary">-</Text>,
        },
        {
            title: 'Keyword',
            key: 'keyword',
            width: '15%',
            render: (_: unknown, record: TestCase) => {
                const { keyword: kw } = parsePath(record.path)
                return <CopyableCell value={kw} />
            },
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: '20%',
            ellipsis: true,
        },
        {
            title: 'Status',
            key: 'status',
            width: '10%',
            render: (_: unknown, record: TestCase) => {
                const match = syncResults[record.id]
                if (!match) {
                    return <Tag icon={<MinusCircleOutlined />} color="default">No match</Tag>
                }
                return (
                    <Tooltip title={`${match.filePath}:${match.line}`}>
                        <Tag
                            icon={<CheckCircleOutlined />}
                            color="success"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                navigator.clipboard.writeText(match.filePath)
                                message.success(`Copied: ${match.filePath}`)
                            }}
                        >
                            Matched
                        </Tag>
                    </Tooltip>
                )
            },
        },
        {
            title: 'Action',
            key: 'action',
            width: '10%',
            render: (_: unknown, record: TestCase) => {
                const match = syncResults[record.id]
                return (
                    <Space size="small">
                        <Tooltip title={match ? `${match.filePath}:${match.line}` : 'Run Sync first'}>
                            <Button
                                type="text"
                                icon={<FileOutlined />}
                                size="small"
                                disabled={!match}
                                onClick={async () => {
                                    if (!match) return
                                    try {
                                        const src = await window.codescanApi.getFileSource(match.filePath)
                                        setViewTestFile({ path: match.filePath, line: match.line, source: src || '// File not found' })
                                    } catch {
                                        message.error('Failed to load test file')
                                    }
                                }}
                            />
                        </Tooltip>
                        <Button
                            type="text"
                            icon={<ThunderboltOutlined />}
                            size="small"
                            loading={generatingPrompt === record.id}
                            onClick={() => handleGeneratePrompt(record)}
                            title="Generate test prompt"
                        />
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => handleEdit(record)}
                        />
                        <Popconfirm
                            title="Delete this test case?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                        </Popconfirm>
                    </Space>
                )
            },
        },
    ]

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    {pageTitle}
                </Title>
                <Space>
                    {category === 'unit' && (
                        <Button
                            icon={<SyncOutlined spin={syncing} />}
                            onClick={handleSync}
                            loading={syncing}
                        >
                            Sync
                        </Button>
                    )}
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleNewTest}
                        disabled={showInput}
                    >
                        New Test
                    </Button>
                </Space>
            </div>

            {/* Inline input row */}
            {showInput && (
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        marginBottom: 16,
                        padding: '12px 16px',
                        background: 'var(--ant-color-bg-layout)',
                        borderRadius: 8,
                        border: '1px solid var(--ant-color-border)',
                    }}
                >
                    <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value)
                            if (inputError) setInputError('')
                        }}
                        placeholder="path keyword — 如 src/App.tsx menuItems"
                        status={inputError ? 'error' : undefined}
                        style={{ flex: 1, fontFamily: 'monospace' }}
                        onPressEnter={handleInputConfirm}
                        disabled={lookingUp}
                        suffix={lookingUp ? <Spin size="small" /> : undefined}
                    />
                    <Button
                        type="primary"
                        icon={<EnterOutlined />}
                        onClick={handleInputConfirm}
                        loading={lookingUp}
                        size="small"
                    >
                        Confirm
                    </Button>
                    <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={handleInputCancel}
                        size="small"
                    />
                </div>
            )}
            {showInput && inputError && (
                <div style={{ color: '#ff4d4f', fontSize: 13, marginBottom: 12, marginTop: -8 }}>
                    {inputError}
                </div>
            )}

            {/* Table */}
            {tests.length > 0 ? (
                <Table
                    dataSource={tests}
                    columns={columns}
                    rowKey="id"
                    size="small"
                    pagination={false}
                />
            ) : (
                <Empty
                    description="No test cases yet. Click 'New Test' to create one."
                    style={{ marginTop: 80 }}
                />
            )}

            {/* Multi-match selection modal */}
            <Modal
                title={
                    <Space>
                        <WarningOutlined style={{ color: '#faad14' }} />
                        <span>匹配到 {matchCandidates.length} 个语法单元，请选择</span>
                    </Space>
                }
                open={showMatchModal}
                onCancel={() => {
                    setShowMatchModal(false)
                    setMatchCandidates([])
                }}
                footer={null}
                width={600}
            >
                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                    {matchCandidates.map((u, idx) => (
                        <div
                            key={idx}
                            style={{
                                padding: '10px 12px',
                                marginBottom: 8,
                                borderRadius: 6,
                                border: '1px solid var(--ant-color-border)',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                            onClick={() => handleSelectMatch(u)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--ant-color-primary-bg)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = ''
                            }}
                        >
                            <Space>
                                <Tag color="blue">{u.type}</Tag>
                                <Text code>{u.name}</Text>
                            </Space>
                            <div style={{ marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {u.filePath}
                                </Text>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* Test Drawer — Create / Edit */}
            {pendingUnit && (
                <TestDrawer
                    open={drawerOpen}
                    onCancel={() => {
                        setDrawerOpen(false)
                        setPendingUnit(null)
                        setEditingTest(null)
                        setDrawerMode('create')
                    }}
                    onSave={handleSaveFromDrawer}
                    unit={pendingUnit}
                    keyword={pendingKeyword}
                    mode={drawerMode}
                    editingTest={editingTest}
                />
            )}

            {/* Prompt Modal */}
            <Modal
                title="Generated Test Prompt"
                open={showPromptModal}
                onCancel={() => setShowPromptModal(false)}
                width={800}
                footer={
                    <Space>
                        <Button onClick={() => setShowPromptModal(false)}>Close</Button>
                        <Button
                            type="primary"
                            onClick={() => {
                                navigator.clipboard.writeText(promptText)
                                message.success('Prompt copied to clipboard')
                            }}
                        >
                            Copy Prompt
                        </Button>
                    </Space>
                }
            >
                <pre
                    style={{
                        background: 'var(--ant-color-bg-layout)',
                        borderRadius: 8,
                        padding: 16,
                        fontSize: 13,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: '60vh',
                        overflow: 'auto',
                        border: '1px solid var(--ant-color-border)',
                    }}
                >
                    {promptText}
                </pre>
            </Modal>

            {/* View matched test file — Drawer with highlighted code */}
            <Drawer
                title={viewTestFile ? `Test File: ${viewTestFile.path}` : 'Test File'}
                open={!!viewTestFile}
                onClose={() => setViewTestFile(null)}
                width="70%"
                placement="right"
            >
                {viewTestFile && (() => {
                    const lines = viewTestFile.source.split('\n')
                    const matchLine = viewTestFile.line // 1-indexed line where [id] was found

                    // Find the describe block range by counting braces
                    const blockStart = matchLine
                    let blockEnd = matchLine
                    let braceCount = 0
                    let foundOpen = false
                    for (let i = matchLine - 1; i < lines.length; i++) {
                        const line = lines[i]
                        for (const ch of line) {
                            if (ch === '{') { braceCount++; foundOpen = true }
                            if (ch === '}') braceCount--
                        }
                        if (foundOpen && braceCount <= 0) {
                            blockEnd = i + 1 // 1-indexed
                            break
                        }
                    }

                    return (
                        <div
                            style={{
                                height: '100%',
                                overflow: 'auto',
                                background: 'var(--ant-color-bg-layout)',
                                borderRadius: 8,
                                border: '1px solid var(--ant-color-border)',
                                fontFamily: 'monospace',
                                fontSize: 13,
                                lineHeight: 1.6,
                                padding: 0,
                            }}
                        >
                            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                                <tbody>
                                    {lines.map((lineText, idx) => {
                                        const lineNum = idx + 1
                                        const isHighlighted = lineNum >= blockStart && lineNum <= blockEnd
                                        return (
                                            <tr
                                                key={lineNum}
                                                style={{
                                                    background: isHighlighted
                                                        ? 'rgba(22, 119, 255, 0.12)'
                                                        : 'transparent',
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        padding: '0 12px 0 16px',
                                                        textAlign: 'right',
                                                        color: 'var(--ant-color-text-quaternary)',
                                                        userSelect: 'none',
                                                        whiteSpace: 'nowrap',
                                                        fontSize: 12,
                                                        width: 1,
                                                        borderRight: isHighlighted
                                                            ? '3px solid var(--ant-color-primary)'
                                                            : '3px solid transparent',
                                                    }}
                                                >
                                                    {lineNum}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '0 16px',
                                                        whiteSpace: 'pre',
                                                    }}
                                                >
                                                    {lineText}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                })()}
            </Drawer>
        </div>
    )
}

export function UnitTestsPage() {
    return <TestsPage category="unit" />
}

export function SpecTestsPage() {
    return <TestsPage category="spec" />
}
