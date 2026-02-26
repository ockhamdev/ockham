import React, { useCallback, useEffect, useState } from 'react'
import {
    Button,
    Input,
    InputNumber,
    Typography,
    Table,
    Space,
    Modal,
    Form,
    message,
    Empty,
    Tag,
    Popconfirm,
} from 'antd'
import {
    PlusOutlined,
    DeleteOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import type { TestCase, SyntaxUnit } from '@ockham/shared'
import { v7 as uuidv7 } from 'uuid'

const { Title, Text } = Typography

declare global {
    interface Window {
        testsApi: {
            load(): Promise<TestCase[]>
            save(items: TestCase[]): Promise<void>
            lookupUnit(filePath: string, line: number): Promise<SyntaxUnit | null>
        }
    }
}

// ── Create Test Case Modal ────────────────────────────
function CreateTestModal({
    open,
    onCancel,
    onCreate,
}: {
    open: boolean
    onCancel: () => void
    onCreate: (tc: TestCase) => void
}) {
    const [filePath, setFilePath] = useState('')
    const [line, setLine] = useState<number>(1)
    const [description, setDescription] = useState('')
    const [lookingUp, setLookingUp] = useState(false)
    const [foundUnit, setFoundUnit] = useState<SyntaxUnit | null>(null)
    const [lookupError, setLookupError] = useState('')

    const handleLookup = useCallback(async () => {
        if (!filePath.trim()) {
            setLookupError('Please enter a file path')
            return
        }
        setLookingUp(true)
        setLookupError('')
        setFoundUnit(null)

        try {
            const unit = await window.testsApi.lookupUnit(filePath.trim(), line)
            if (unit) {
                setFoundUnit(unit)
            } else {
                setLookupError(`No syntax unit found at ${filePath}:${line}. Make sure you have run a scan first.`)
            }
        } catch (err) {
            setLookupError(err instanceof Error ? err.message : 'Lookup failed')
        }
        setLookingUp(false)
    }, [filePath, line])

    const handleCreate = useCallback(() => {
        if (!foundUnit) return

        const key = `${foundUnit.filePath}::${foundUnit.type}`
        const tc: TestCase = {
            id: uuidv7(),
            key,
            filePath: foundUnit.filePath,
            line,
            unitType: foundUnit.type,
            unitName: foundUnit.name,
            description: description.trim() || `Test for ${foundUnit.name}`,
            createdAt: new Date().toISOString(),
        }
        onCreate(tc)

        // Reset form
        setFilePath('')
        setLine(1)
        setDescription('')
        setFoundUnit(null)
        setLookupError('')
    }, [foundUnit, line, description, onCreate])

    const handleCancel = useCallback(() => {
        setFilePath('')
        setLine(1)
        setDescription('')
        setFoundUnit(null)
        setLookupError('')
        onCancel()
    }, [onCancel])

    return (
        <Modal
            title="Create Test Case"
            open={open}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Cancel
                </Button>,
                <Button
                    key="create"
                    type="primary"
                    disabled={!foundUnit}
                    onClick={handleCreate}
                >
                    Create
                </Button>,
            ]}
            width={560}
        >
            <Form layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item label="File Path (relative to workspace)" required>
                    <Input
                        value={filePath}
                        onChange={(e) => setFilePath(e.target.value)}
                        placeholder="src/components/App.tsx"
                    />
                </Form.Item>
                <Form.Item label="Line Number" required>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <InputNumber
                            min={1}
                            value={line}
                            onChange={(v) => setLine(v || 1)}
                            style={{ width: 120 }}
                        />
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            loading={lookingUp}
                            onClick={handleLookup}
                        >
                            Lookup
                        </Button>
                    </div>
                </Form.Item>

                {lookupError && (
                    <div style={{ color: '#ff4d4f', marginBottom: 16, fontSize: 13 }}>
                        {lookupError}
                    </div>
                )}

                {foundUnit && (
                    <div
                        style={{
                            padding: 12,
                            background: 'var(--ant-color-bg-layout)',
                            borderRadius: 8,
                            marginBottom: 16,
                        }}
                    >
                        <Text strong>Found Syntax Unit:</Text>
                        <div style={{ marginTop: 8 }}>
                            <Space>
                                <Tag color="blue">{foundUnit.type}</Tag>
                                <Text code>{foundUnit.name}</Text>
                            </Space>
                            <div style={{ marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {foundUnit.filePath} (L{foundUnit.startLine}–{foundUnit.endLine})
                                </Text>
                            </div>
                            <div style={{ marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Key: <Text code style={{ fontSize: 12 }}>{foundUnit.filePath}::{foundUnit.type}</Text>
                                </Text>
                            </div>
                        </div>
                    </div>
                )}

                <Form.Item label="Description (optional)">
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What should this test verify?"
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

// ── Main TestsPage ────────────────────────────────────
export function TestsPage() {
    const [tests, setTests] = useState<TestCase[]>([])
    const [modalOpen, setModalOpen] = useState(false)

    // Load persisted test cases on mount
    useEffect(() => {
        window.testsApi.load().then((items) => {
            if (items?.length) setTests(items)
        })
    }, [])

    const handleCreate = useCallback(
        (tc: TestCase) => {
            const updated = [...tests, tc]
            setTests(updated)
            window.testsApi.save(updated)
            setModalOpen(false)
            message.success(`Test case created: ${tc.unitName}`)
        },
        [tests]
    )

    const handleDelete = useCallback(
        (id: string) => {
            const updated = tests.filter((t) => t.id !== id)
            setTests(updated)
            window.testsApi.save(updated)
        },
        [tests]
    )

    const columns = [
        {
            title: 'Key',
            dataIndex: 'key',
            key: 'key',
            width: '35%',
            render: (key: string) => <Text code style={{ fontSize: 12 }}>{key}</Text>,
        },
        {
            title: 'Name',
            dataIndex: 'unitName',
            key: 'unitName',
            width: '15%',
        },
        {
            title: 'Type',
            dataIndex: 'unitType',
            key: 'unitType',
            width: '15%',
            render: (type: string) => <Tag color="blue">{type}</Tag>,
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: '25%',
        },
        {
            title: 'Action',
            key: 'action',
            width: '10%',
            render: (_: unknown, record: TestCase) => (
                <Popconfirm
                    title="Delete this test case?"
                    onConfirm={() => handleDelete(record.id)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
            ),
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
                    Tests
                </Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setModalOpen(true)}
                >
                    New Test Case
                </Button>
            </div>

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
                    description="No test cases yet. Click 'New Test Case' to create one."
                    style={{ marginTop: 80 }}
                />
            )}

            {/* Create Modal */}
            <CreateTestModal
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onCreate={handleCreate}
            />
        </div>
    )
}
