import React, { useCallback, useEffect, useState } from 'react'
import {
    Button,
    Typography,
    Table,
    Tabs,
    Tag,
    Space,
    Modal,
    Input,
    Form,
    message,
    Popconfirm,
    Tooltip,
    Empty,
    Badge,
    Statistic,
    Row,
    Col,
    Card,
    Drawer,
    Descriptions,
} from 'antd'
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    PlusOutlined,
    ReloadOutlined,
    FileTextOutlined,
    ExperimentOutlined,
    BookOutlined,
} from '@ant-design/icons'
import type { UnitTestProposal, SpecTestProposal, StoryProposal } from '../api'
import {
    listUnitTestProposals,
    createUnitTestProposal,
    reviewUnitTestProposal,
    deleteUnitTestProposal,
    listSpecTestProposals,
    createSpecTestProposal,
    reviewSpecTestProposal,
    deleteSpecTestProposal,
    listStoryProposals,
    createStoryProposal,
    reviewStoryProposal,
    deleteStoryProposal,
} from '../api'

const { Title, Text } = Typography
const { TextArea } = Input

type ProposalStatus = 'pending' | 'approved' | 'rejected'

const statusColor = (s: string) => {
    if (s === 'approved') return 'success'
    if (s === 'rejected') return 'error'
    return 'processing'
}

interface ProposalsPageProps {
    projectId: string
}

export function ProposalsPage({ projectId }: ProposalsPageProps) {
    const [unitTests, setUnitTests] = useState<UnitTestProposal[]>([])
    const [specTests, setSpecTests] = useState<SpecTestProposal[]>([])
    const [stories, setStories] = useState<StoryProposal[]>([])
    const [loading, setLoading] = useState(false)
    const [reviewNote, setReviewNote] = useState('')

    // Detail drawer state
    const [detailOpen, setDetailOpen] = useState(false)
    const [detailType, setDetailType] = useState<'unit' | 'spec' | 'story'>('unit')
    const [detailRecord, setDetailRecord] = useState<UnitTestProposal | SpecTestProposal | StoryProposal | null>(null)

    // Create modal
    const [showCreate, setShowCreate] = useState(false)
    const [createType, setCreateType] = useState<'unit' | 'spec' | 'story'>('unit')
    const [form] = Form.useForm()

    const loadAll = useCallback(async () => {
        if (!projectId) return
        setLoading(true)
        try {
            const [ut, st, sp] = await Promise.all([
                listUnitTestProposals(projectId),
                listSpecTestProposals(projectId),
                listStoryProposals(projectId),
            ])
            setUnitTests(ut)
            setSpecTests(st)
            setStories(sp)
        } catch {
            message.error('Failed to load proposals')
        }
        setLoading(false)
    }, [projectId])

    useEffect(() => { loadAll() }, [loadAll])

    // ── Review handlers ──
    const handleReviewUnit = useCallback(async (id: string, action: 'approve' | 'reject') => {
        if (action === 'approve') {
            const entry = unitTests.find(e => e.id === id)
            if (entry && !entry.linkedFilePath) {
                message.warning('此提议还未 Link 到测试实现，请先 Link 后再审批')
                return
            }
        }
        try {
            await reviewUnitTestProposal(id, action, reviewNote)
            message.success(action === 'approve' ? 'Approved' : 'Rejected')
            setReviewNote('')
            loadAll()
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Review failed')
        }
    }, [unitTests, reviewNote, loadAll])

    const handleReviewSpec = useCallback(async (id: string, action: 'approve' | 'reject') => {
        if (action === 'approve') {
            const entry = specTests.find(e => e.id === id)
            if (entry && !entry.linkedFilePath) {
                message.warning('此提议还未 Link 到测试实现，请先 Link 后再审批')
                return
            }
        }
        try {
            await reviewSpecTestProposal(id, action, reviewNote)
            message.success(action === 'approve' ? 'Approved' : 'Rejected')
            setReviewNote('')
            loadAll()
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Review failed')
        }
    }, [specTests, reviewNote, loadAll])

    const handleReviewStory = useCallback(async (id: string, action: 'approve' | 'reject') => {
        try {
            await reviewStoryProposal(id, action, reviewNote)
            message.success(action === 'approve' ? 'Approved' : 'Rejected')
            setReviewNote('')
            loadAll()
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Review failed')
        }
    }, [reviewNote, loadAll])

    // ── Create handler ──
    const handleCreate = useCallback(async () => {
        try {
            const values = await form.validateFields()
            if (createType === 'unit') {
                await createUnitTestProposal({
                    projectId, path: values.path, description: values.description || '', proposedBy: values.proposedBy,
                })
            } else if (createType === 'spec') {
                await createSpecTestProposal({
                    projectId, title: values.title, description: values.description || '', proposedBy: values.proposedBy,
                })
            } else {
                await createStoryProposal({
                    projectId, title: values.title, enrichedText: values.enrichedText || '', proposedBy: values.proposedBy,
                })
            }
            message.success('Proposal created')
            form.resetFields()
            setShowCreate(false)
            loadAll()
        } catch { /* validation error */ }
    }, [form, createType, projectId, loadAll])

    // ── Stats ──
    const pendingUnit = unitTests.filter(e => e.status === 'pending').length
    const pendingSpec = specTests.filter(e => e.status === 'pending').length
    const pendingStory = stories.filter(e => e.status === 'pending').length
    const totalPending = pendingUnit + pendingSpec + pendingStory

    // ── Action column renderer ──
    function renderActions(record: { id: string; status: string; linkedFilePath?: string | null }, reviewFn: (id: string, action: 'approve' | 'reject') => Promise<void>, deleteFn: (id: string) => Promise<void>, requireLink = false) {
        if (record.status !== 'pending') {
            return <Tag color={statusColor(record.status)}>{record.status}</Tag>
        }
        return (
            <Space size="small">
                <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    disabled={requireLink && !record.linkedFilePath}
                    onClick={() => {
                        Modal.confirm({
                            title: 'Approve this proposal?',
                            icon: <ExclamationCircleOutlined />,
                            content: (
                                <TextArea placeholder="Review note (optional)" rows={2} onChange={(e) => setReviewNote(e.target.value)} />
                            ),
                            onOk: () => reviewFn(record.id, 'approve'),
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
                            title: 'Reject?',
                            content: <TextArea placeholder="Reason" rows={2} onChange={(e) => setReviewNote(e.target.value)} />,
                            onOk: () => reviewFn(record.id, 'reject'),
                        })
                    }}
                >
                    Reject
                </Button>
                <Popconfirm title="Delete?" onConfirm={() => deleteFn(record.id)}>
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
            </Space>
        )
    }

    // ── Unit Test columns ──
    const unitColumns = [
        { title: 'Path', dataIndex: 'path', key: 'path', width: '25%', ellipsis: true },
        { title: 'Description', dataIndex: 'description', key: 'description', width: '25%', ellipsis: true },
        { title: 'Proposed By', dataIndex: 'proposedBy', key: 'proposedBy', width: '10%' },
        {
            title: 'Linked', key: 'linked', width: '10%',
            render: (_: unknown, r: UnitTestProposal) => r.linkedFilePath
                ? <Tooltip title={r.linkedFilePath}><Tag icon={<CheckCircleOutlined />} color="success">Linked</Tag></Tooltip>
                : <Tag color="default">Not linked</Tag>,
        },
        {
            title: 'Action', key: 'action', width: '30%',
            render: (_: unknown, r: UnitTestProposal) => renderActions(r, handleReviewUnit, async (id) => { await deleteUnitTestProposal(id); loadAll() }, true),
        },
    ]

    // ── Spec Test columns ──
    const specColumns = [
        { title: 'Title', dataIndex: 'title', key: 'title', width: '25%', ellipsis: true },
        { title: 'Description', dataIndex: 'description', key: 'description', width: '25%', ellipsis: true },
        { title: 'Proposed By', dataIndex: 'proposedBy', key: 'proposedBy', width: '10%' },
        {
            title: 'Linked', key: 'linked', width: '10%',
            render: (_: unknown, r: SpecTestProposal) => r.linkedFilePath
                ? <Tooltip title={r.linkedFilePath}><Tag icon={<CheckCircleOutlined />} color="success">Linked</Tag></Tooltip>
                : <Tag color="default">Not linked</Tag>,
        },
        {
            title: 'Action', key: 'action', width: '30%',
            render: (_: unknown, r: SpecTestProposal) => renderActions(r, handleReviewSpec, async (id) => { await deleteSpecTestProposal(id); loadAll() }, true),
        },
    ]

    // ── Story columns ──
    const storyColumns = [
        { title: 'Title', dataIndex: 'title', key: 'title', width: '30%', ellipsis: true },
        {
            title: 'Content', dataIndex: 'enrichedText', key: 'enrichedText', width: '25%', ellipsis: true,
            render: (v: string) => v || <Text type="secondary">—</Text>
        },
        { title: 'Proposed By', dataIndex: 'proposedBy', key: 'proposedBy', width: '10%' },
        {
            title: 'Action', key: 'action', width: '25%',
            render: (_: unknown, r: StoryProposal) => renderActions(r, handleReviewStory, async (id) => { await deleteStoryProposal(id); loadAll() }),
        },
    ]

    const tabItems = [
        {
            key: 'unit',
            label: <Badge count={pendingUnit} offset={[10, 0]} size="small"><Space><FileTextOutlined />Unit Tests</Space></Badge>,
            children: (
                <Table dataSource={unitTests} columns={unitColumns} rowKey="id" loading={loading} size="small" pagination={false}
                    locale={{ emptyText: <Empty description="No unit test proposals" /> }}
                    onRow={(record) => ({ onClick: () => { setDetailRecord(record); setDetailType('unit'); setDetailOpen(true) }, style: { cursor: 'pointer' } })} />
            ),
        },
        {
            key: 'spec',
            label: <Badge count={pendingSpec} offset={[10, 0]} size="small"><Space><ExperimentOutlined />Spec Tests</Space></Badge>,
            children: (
                <Table dataSource={specTests} columns={specColumns} rowKey="id" loading={loading} size="small" pagination={false}
                    locale={{ emptyText: <Empty description="No spec test proposals" /> }}
                    onRow={(record) => ({ onClick: () => { setDetailRecord(record); setDetailType('spec'); setDetailOpen(true) }, style: { cursor: 'pointer' } })} />
            ),
        },
        {
            key: 'story',
            label: <Badge count={pendingStory} offset={[10, 0]} size="small"><Space><BookOutlined />Stories</Space></Badge>,
            children: (
                <Table dataSource={stories} columns={storyColumns} rowKey="id" loading={loading} size="small" pagination={false}
                    locale={{ emptyText: <Empty description="No story proposals" /> }}
                    onRow={(record) => ({ onClick: () => { setDetailRecord(record); setDetailType('story'); setDetailOpen(true) }, style: { cursor: 'pointer' } })} />
            ),
        },
    ]

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Proposals</Title>
                <Space>
                    <Button icon={<ReloadOutlined />} loading={loading} onClick={loadAll}>
                        Refresh
                    </Button>
                    <Button icon={<PlusOutlined />} onClick={() => { setCreateType('unit'); setShowCreate(true) }}>
                        Unit Test
                    </Button>
                    <Button icon={<PlusOutlined />} onClick={() => { setCreateType('spec'); setShowCreate(true) }}>
                        Spec Test
                    </Button>
                    <Button icon={<PlusOutlined />} onClick={() => { setCreateType('story'); setShowCreate(true) }}>
                        Story
                    </Button>
                </Space>
            </div>

            {/* Stats */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card size="small">
                        <Statistic title="Pending" value={totalPending} valueStyle={{ color: '#1677ff' }} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card size="small">
                        <Statistic title="Unit Tests" value={unitTests.length} suffix={pendingUnit > 0 ? `(${pendingUnit} pending)` : ''} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card size="small">
                        <Statistic title="Spec Tests" value={specTests.length} suffix={pendingSpec > 0 ? `(${pendingSpec} pending)` : ''} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card size="small">
                        <Statistic title="Stories" value={stories.length} suffix={pendingStory > 0 ? `(${pendingStory} pending)` : ''} />
                    </Card>
                </Col>
            </Row>

            {/* Tabbed content */}
            <Tabs items={tabItems} />

            {/* Create Modal */}
            <Modal
                title={`New ${createType === 'unit' ? 'Unit Test' : createType === 'spec' ? 'Spec Test' : 'Story'} Proposal`}
                open={showCreate}
                onOk={handleCreate}
                onCancel={() => { setShowCreate(false); form.resetFields() }}
                okText="Submit"
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="proposedBy" label="Proposed By" rules={[{ required: true, message: 'Required' }]}>
                        <Input placeholder="Name or identifier" />
                    </Form.Item>
                    {createType === 'unit' ? (
                        <>
                            <Form.Item name="path" label="Path" rules={[{ required: true, message: 'Required' }]}>
                                <Input placeholder="src/App.tsx menuItems" style={{ fontFamily: 'monospace' }} />
                            </Form.Item>
                            <Form.Item name="description" label="Description">
                                <TextArea rows={3} placeholder="Test requirements..." />
                            </Form.Item>
                        </>
                    ) : createType === 'spec' ? (
                        <>
                            <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Required' }]}>
                                <Input placeholder="Test case title" />
                            </Form.Item>
                            <Form.Item name="description" label="Description">
                                <TextArea rows={3} placeholder="Test requirements..." />
                            </Form.Item>
                        </>
                    ) : (
                        <>
                            <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Required' }]}>
                                <Input placeholder="Story title" />
                            </Form.Item>
                            <Form.Item name="enrichedText" label="Story Content">
                                <TextArea rows={4} placeholder="Story description..." />
                            </Form.Item>
                        </>
                    )}
                </Form>
            </Modal>

            {/* Detail Drawer */}
            <Drawer
                title={detailType === 'unit' ? 'Unit Test Proposal' : detailType === 'spec' ? 'Spec Test Proposal' : 'Story Proposal'}
                open={detailOpen}
                onClose={() => { setDetailOpen(false); setDetailRecord(null) }}
                width={600}
            >
                {detailRecord && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="ID">
                            <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>{detailRecord.id}</Text>
                        </Descriptions.Item>

                        {detailType === 'unit' && 'path' in detailRecord && (
                            <Descriptions.Item label="Path">
                                <Text code>{(detailRecord as UnitTestProposal).path}</Text>
                            </Descriptions.Item>
                        )}

                        {(detailType === 'spec' || detailType === 'story') && 'title' in detailRecord && (
                            <Descriptions.Item label="Title">
                                <Text strong>{(detailRecord as SpecTestProposal | StoryProposal).title}</Text>
                            </Descriptions.Item>
                        )}

                        {'description' in detailRecord && (detailRecord as UnitTestProposal | SpecTestProposal).description && (
                            <Descriptions.Item label="Description">
                                <div style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                                    {(detailRecord as UnitTestProposal | SpecTestProposal).description}
                                </div>
                            </Descriptions.Item>
                        )}

                        {detailType === 'story' && 'enrichedText' in detailRecord && (detailRecord as StoryProposal).enrichedText && (
                            <Descriptions.Item label="Content">
                                <div style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                                    {(detailRecord as StoryProposal).enrichedText}
                                </div>
                            </Descriptions.Item>
                        )}

                        <Descriptions.Item label="Status">
                            <Tag color={statusColor(detailRecord.status)}>{detailRecord.status}</Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Proposed By">
                            {detailRecord.proposedBy}
                        </Descriptions.Item>

                        {'linkedFilePath' in detailRecord && (
                            <Descriptions.Item label="Linked File">
                                {(detailRecord as UnitTestProposal | SpecTestProposal).linkedFilePath
                                    ? <Text code>{(detailRecord as UnitTestProposal | SpecTestProposal).linkedFilePath}</Text>
                                    : <Text type="secondary">Not linked</Text>}
                            </Descriptions.Item>
                        )}

                        {'reviewedBy' in detailRecord && detailRecord.reviewedBy && (
                            <Descriptions.Item label="Reviewed By">
                                {detailRecord.reviewedBy}
                            </Descriptions.Item>
                        )}

                        {'reviewNote' in detailRecord && (detailRecord as UnitTestProposal).reviewNote && (
                            <Descriptions.Item label="Review Note">
                                {(detailRecord as UnitTestProposal).reviewNote}
                            </Descriptions.Item>
                        )}

                        <Descriptions.Item label="Created">
                            {new Date(detailRecord.createdAt).toLocaleString()}
                        </Descriptions.Item>

                        <Descriptions.Item label="Updated">
                            {new Date(detailRecord.updatedAt).toLocaleString()}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Drawer>
        </div>
    )
}
