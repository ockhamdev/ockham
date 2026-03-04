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
    CloseCircleOutlined,
    WarningOutlined,
    EditOutlined,
    ThunderboltOutlined,
    LinkOutlined,
    CheckCircleOutlined,
    MinusCircleOutlined,
    FileOutlined,
} from '@ant-design/icons'
import type { TestCase, SyntaxUnit, SpecTest, SpecTestGroup } from '@ockham/shared'
import { SourceViewer } from '../components/SourceViewer'
import { MarkdownViewer } from '../components/MarkdownViewer'
import {
    getPromptTemplate,
    listTestCases, createTestCaseInDB, updateTestCaseInDB, deleteTestCaseInDB,
    listUnitTestProposals, createUnitTestProposal, reviewUnitTestProposal, deleteUnitTestProposal,
} from '../api'
import { UnitTestProposalDrawer } from '../components/UnitTestProposalDrawer'
import { CopyableCell, parsePath } from '../components/CopyableCell'

const { Title, Text } = Typography

declare global {
    interface Window {
        testsApi: {
            lookupUnit(filePath: string, keyword: string): Promise<SyntaxUnit[]>
            link(testIds: string[]): Promise<Record<string, { filePath: string; line: number }>>
        }
        specTestsApi: {
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
                        <SourceViewer
                            source={fileSource}
                            filePath={unit.filePath}
                            highlightStart={unit.startLine}
                            highlightEnd={unit.endLine}
                            style={{ height: '100%' }}
                        />
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

                        {/* Requirements */}
                        <Form.Item label="Requirements" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
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

function TestsPage({ projectId, mode = 'tests' }: { projectId?: string; mode?: 'tests' | 'proposals' }) {
    const isProposals = mode === 'proposals'
    // IPC only for local filesystem ops (lookupUnit, link)
    const localApi = window.testsApi
    const [tests, setTests] = useState<TestCase[]>([])
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [showProposals, setShowProposals] = useState(false)

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

    // For syntax-aware linking
    const [linking, setLinking] = useState(false)
    const [linkResults, setLinkResults] = useState<Record<string, { filePath: string; line: number }>>({})

    // Perform linking via IPC (reads filesystem)
    const handleLink = useCallback(async () => {
        setLinking(true)
        try {
            const ids = tests.map((t) => t.id)
            const results = await localApi.link(ids)
            setLinkResults(results)
            const matched = Object.keys(results).length
            message.success(`Link complete: ${matched}/${ids.length} linked`)
        } catch {
            message.error('Link failed')
        }
        setLinking(false)
    }, [tests, localApi])

    // Load persisted test cases from DB on mount
    useEffect(() => {
        if (projectId) {
            const loader = isProposals ? listUnitTestProposals : listTestCases
            loader(projectId).then((items) => {
                if (items?.length) setTests(items as unknown as TestCase[])
                else setTests([])
            })
        }
    }, [projectId, isProposals])

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

    const openDrawerWithUnit = useCallback(
        (unit: SyntaxUnit, filePath: string, keyword: string) => {
            setPendingUnit(unit)
            setPendingFilePath(filePath)
            setPendingKeyword(keyword)
            setDrawerOpen(true)
        },
        []
    )

    // Inline input: parse user input (filePath keyword) and lookup syntax unit via IPC
    const handleInlineSubmit = useCallback(async () => {
        const val = inputValue.trim()
        if (!val) return

        const parts = val.split(/\s+/)
        if (parts.length < 2) {
            setInputError('Format: filePath keyword')
            return
        }
        const filePath = parts[0]
        const keyword = parts.slice(1).join(' ')

        setLookingUp(true)
        setInputError('')

        try {
            const units = await localApi.lookupUnit(filePath, keyword)

            if (units.length === 0) {
                setInputError(`No match for "${keyword}" in ${filePath}`)
            } else if (units.length === 1) {
                setShowInput(false)
                setInputValue('')
                setDrawerMode('create')
                setEditingTest(null)
                openDrawerWithUnit(units[0], filePath, keyword)
            } else {
                // Multiple matches — show selector
                setMatchCandidates(units)
                setPendingFilePath(filePath)
                setPendingKeyword(keyword)
                setShowMatchModal(true)
            }
        } catch (err) {
            setInputError(err instanceof Error ? err.message : 'Lookup failed')
        }
        setLookingUp(false)
    }, [inputValue, localApi, openDrawerWithUnit])

    const handleSelectMatch = useCallback((unit: SyntaxUnit) => {
        setShowMatchModal(false)
        setMatchCandidates([])
        openDrawerWithUnit(unit, pendingFilePath, pendingKeyword)
    }, [pendingFilePath, pendingKeyword, openDrawerWithUnit])

    const handleSaveFromDrawer = useCallback(
        async (tc: TestCase) => {
            if (drawerMode === 'edit' && !isProposals) {
                setTests(prev => prev.map((t) => (t.id === tc.id ? tc : t)))
                if (projectId) {
                    await updateTestCaseInDB(tc.id, { path: tc.path, contentHash: tc.contentHash, description: tc.description })
                }
            } else {
                setTests(prev => [...prev, tc])
                if (projectId) {
                    if (isProposals) {
                        await createUnitTestProposal({ projectId, path: tc.path, description: tc.description, proposedBy: 'desktop' })
                    } else {
                        await createTestCaseInDB({ projectId, path: tc.path, contentHash: tc.contentHash, description: tc.description })
                    }
                }
            }
            setDrawerOpen(false)
            setPendingUnit(null)
            setEditingTest(null)
            message.success(drawerMode === 'edit' ? 'Test updated' : `${isProposals ? 'Proposal' : 'Test'} created: ${parsePath(tc.path).keyword}`)
        },
        [drawerMode, projectId, isProposals]
    )

    const handleEdit = useCallback((tc: TestCase) => {
        const { filePath, keyword: kw } = parsePath(tc.path)
        setEditingTest(tc)
        setDrawerMode('edit')
        setPendingKeyword(kw)
        localApi.lookupUnit(filePath, kw).then((units) => {
            if (units.length > 0) {
                setPendingUnit(units[0])
                setPendingFilePath(filePath)
                setDrawerOpen(true)
            } else {
                message.error('Could not find syntax unit for this test')
                setEditingTest(null)
            }
        })
    }, [localApi])

    const handleDelete = useCallback(
        async (id: string) => {
            setTests(prev => prev.filter((t) => t.id !== id))
            if (projectId) {
                if (isProposals) {
                    await deleteUnitTestProposal(id)
                } else {
                    await deleteTestCaseInDB(id)
                }
            }
        },
        [projectId, isProposals]
    )

    // ── Proposals: approve/reject ──
    const [reviewNote, setReviewNote] = useState('')
    const handleReview = useCallback(async (id: string, action: 'approve' | 'reject') => {
        if (action === 'approve') {
            const entry = tests.find(t => t.id === id)
            if (entry && !(entry as unknown as { linkedFilePath?: string }).linkedFilePath) {
                message.warning('此提议还未 Link，请先 Link 后再审批')
                return
            }
        }
        try {
            await reviewUnitTestProposal(id, action, reviewNote)
            message.success(action === 'approve' ? 'Approved — test merged' : 'Rejected')
            setReviewNote('')
            // Reload
            if (projectId) {
                listUnitTestProposals(projectId).then((items) => {
                    if (items?.length) setTests(items as unknown as TestCase[])
                    else setTests([])
                })
            }
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Review failed')
        }
    }, [tests, reviewNote, projectId])

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
            const units = await localApi.lookupUnit(filePath, kw)
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

            // Load template from DB
            const storedTeam = localStorage.getItem('ockham_current_team')
            const teamId = storedTeam ? JSON.parse(storedTeam).id : null
            let templateStr: string
            if (teamId) {
                const result = await getPromptTemplate(teamId, 'unit_test')
                templateStr = result.template
            } else {
                // Fallback: server returns default when no custom exists
                templateStr = ''
            }

            // Interpolate variables
            const prompt = templateStr
                .replace(/\{\{testId\}\}/g, tc.id)
                .replace(/\{\{filePath\}\}/g, filePath)
                .replace(/\{\{keyword\}\}/g, kw)
                .replace(/\{\{description\}\}/g, tc.description || '')
                .replace(/\{\{sourceSnippet\}\}/g, sourceSnippet)

            setPromptText(prompt)
            setShowPromptModal(true)
        } catch {
            message.error('Failed to generate prompt')
        }
        setGeneratingPrompt(null)
    }, [localApi])

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
            title: 'Requirements',
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
                const match = linkResults[record.id]
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
                            Linked
                        </Tag>
                    </Tooltip>
                )
            },
        },
        {
            title: 'Action',
            key: 'action',
            width: isProposals ? '18%' : '10%',
            render: (_: unknown, record: TestCase) => {
                const match = linkResults[record.id]
                return (
                    <Space size="small">
                        <Tooltip title={match ? `${match.filePath}:${match.line}` : 'Run Link first'}>
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
                        {isProposals ? (
                            <>
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<CheckCircleOutlined />}
                                    disabled={!(record as unknown as { linkedFilePath?: string }).linkedFilePath}
                                    onClick={() => {
                                        Modal.confirm({
                                            title: 'Approve this proposal?',
                                            content: (
                                                <div>
                                                    <p>This will create a unit test from the proposal.</p>
                                                    <TextArea
                                                        placeholder="Review note (optional)"
                                                        rows={2}
                                                        onChange={(e) => setReviewNote(e.target.value)}
                                                    />
                                                </div>
                                            ),
                                            onOk: () => handleReview(record.id, 'approve'),
                                        })
                                    }}
                                >
                                    Approve
                                </Button>
                                <Button
                                    danger
                                    size="small"
                                    icon={<CloseCircleOutlined />}
                                    onClick={() => {
                                        Modal.confirm({
                                            title: 'Reject this proposal?',
                                            content: (
                                                <TextArea
                                                    placeholder="Rejection reason"
                                                    rows={2}
                                                    onChange={(e) => setReviewNote(e.target.value)}
                                                />
                                            ),
                                            onOk: () => handleReview(record.id, 'reject'),
                                        })
                                    }}
                                >
                                    Reject
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => handleEdit(record)}
                            />
                        )}
                        <Popconfirm
                            title={isProposals ? 'Delete this proposal?' : 'Delete this test case?'}
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
                    {isProposals ? 'Unit Test Proposals' : 'Unit Tests'}
                </Title>
                <Space>
                    {!isProposals && projectId && (
                        <Button
                            onClick={() => setShowProposals(true)}
                        >
                            Pool
                        </Button>
                    )}
                    <Button
                        icon={<LinkOutlined spin={linking} />}
                        onClick={handleLink}
                        loading={linking}
                    >
                        Link
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleNewTest}
                        disabled={showInput}
                    >
                        {isProposals ? 'New Proposal' : 'New Test'}
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
                        onPressEnter={handleInlineSubmit}
                        disabled={lookingUp}
                        suffix={lookingUp ? <Spin size="small" /> : undefined}
                    />
                    <Button
                        type="primary"
                        icon={<EnterOutlined />}
                        onClick={handleInlineSubmit}
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
                    description={isProposals ? 'No proposals yet.' : "No test cases yet. Click 'New Test' to create one."}
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

            {/* Prompt Drawer */}
            <Drawer
                title="Generated Test Prompt"
                open={showPromptModal}
                onClose={() => setShowPromptModal(false)}
                width={680}
                footer={
                    <div style={{ textAlign: 'right' }}>
                        <Button
                            type="primary"
                            onClick={() => {
                                const custom = (document.getElementById('unit-custom-prompt') as HTMLTextAreaElement)?.value?.trim()
                                const full = custom ? `${promptText}\n\n${custom}` : promptText
                                navigator.clipboard.writeText(full)
                                message.success('Prompt copied to clipboard')
                            }}
                        >
                            Copy Prompt
                        </Button>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                            Generated Prompt
                        </Text>
                        <MarkdownViewer
                            content={promptText}
                            style={{
                                background: 'var(--ant-color-bg-layout)',
                                borderRadius: 8,
                                padding: 16,
                                overflow: 'auto',
                                border: '1px solid var(--ant-color-border)',
                            }}
                        />
                    </div>
                    <div>
                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                            Additional Instructions (optional)
                        </Text>
                        <TextArea
                            id="unit-custom-prompt"
                            placeholder="Add extra instructions here, e.g. specific edge cases, constraints..."
                            rows={1}
                            style={{ fontSize: 13 }}
                        />
                    </div>
                </div>
            </Drawer>

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

            {/* Proposals Drawer (only in tests mode) */}
            {!isProposals && projectId && (
                <UnitTestProposalDrawer
                    open={showProposals}
                    onClose={() => setShowProposals(false)}
                    projectId={projectId}
                    linkResults={linkResults}
                    onApproved={() => {
                        if (projectId) listTestCases(projectId).then((items) => { if (items?.length) setTests(items as unknown as TestCase[]) })
                    }}
                />
            )}
        </div>
    )
}

export function UnitTestsPage({ projectId }: { projectId?: string }) {
    return <TestsPage projectId={projectId} />
}

export function UnitTestProposalsPage({ projectId }: { projectId?: string }) {
    return <TestsPage projectId={projectId} mode="proposals" />
}
