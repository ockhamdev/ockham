import React, { useCallback, useEffect, useState } from 'react'
import {
    Button,
    Input,
    Typography,
    Tabs,
    Table,
    Space,
    Modal,
    Form,
    message,
    Empty,
    Tag,
    Popconfirm,
    Drawer,
    Descriptions,
    Badge,
} from 'antd'
import {
    PlusOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    BookOutlined,
    FileTextOutlined,
    ExperimentOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { StoryProposal } from '../api'
import {
    listStoryProposals,
    createStoryProposal,
    reviewStoryProposal,
    deleteStoryProposal,
} from '../api'
import { UnitTestProposalsPage } from './TestsPage'
import { SpecTestProposalsPage } from './SpecTestsPage'

const { Title, Text } = Typography
const { TextArea } = Input

const statusColor = (s: string) => {
    if (s === 'approved') return 'success'
    if (s === 'rejected') return 'error'
    return 'processing'
}

interface ProposalsPageProps {
    projectId: string
}

export function ProposalsPage({ projectId }: ProposalsPageProps) {
    // ── Stories state (unit tests/spec tests reuse their respective pages) ──
    const [stories, setStories] = useState<StoryProposal[]>([])
    const [loading, setLoading] = useState(false)
    const [reviewNote, setReviewNote] = useState('')

    // Create modal
    const [showCreate, setShowCreate] = useState(false)
    const [form] = Form.useForm()

    // Detail drawer
    const [detailOpen, setDetailOpen] = useState(false)
    const [detailRecord, setDetailRecord] = useState<StoryProposal | null>(null)

    const loadStories = useCallback(async () => {
        if (!projectId) return
        setLoading(true)
        try {
            const sp = await listStoryProposals(projectId)
            setStories(sp)
        } catch {
            message.error('Failed to load story proposals')
        }
        setLoading(false)
    }, [projectId])

    useEffect(() => { loadStories() }, [loadStories])

    const handleReviewStory = useCallback(async (id: string, action: 'approve' | 'reject') => {
        try {
            await reviewStoryProposal(id, action, reviewNote)
            message.success(action === 'approve' ? 'Approved' : 'Rejected')
            setReviewNote('')
            loadStories()
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Review failed')
        }
    }, [reviewNote, loadStories])

    const handleCreate = useCallback(async () => {
        try {
            const values = await form.validateFields()
            await createStoryProposal({
                projectId, title: values.title, enrichedText: values.enrichedText || '', proposedBy: values.proposedBy,
            })
            message.success('Story proposal created')
            form.resetFields()
            setShowCreate(false)
            loadStories()
        } catch { /* validation error */ }
    }, [form, projectId, loadStories])

    const pendingStory = stories.filter(e => e.status === 'pending').length

    const storyColumns = [
        { title: 'Title', dataIndex: 'title', key: 'title', width: '30%', ellipsis: true },
        {
            title: 'Content', dataIndex: 'enrichedText', key: 'enrichedText', width: '25%', ellipsis: true,
            render: (v: string) => v || <Text type="secondary">—</Text>,
        },
        { title: 'Proposed By', dataIndex: 'proposedBy', key: 'proposedBy', width: '10%' },
        {
            title: 'Action', key: 'action', width: '25%',
            render: (_: unknown, record: StoryProposal) => {
                if (record.status !== 'pending') {
                    return <Tag color={statusColor(record.status)}>{record.status}</Tag>
                }
                return (
                    <Space size="small">
                        <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Approve this story?',
                                    icon: <ExclamationCircleOutlined />,
                                    content: (
                                        <TextArea placeholder="Review note (optional)" rows={2} onChange={(e) => setReviewNote(e.target.value)} />
                                    ),
                                    onOk: () => handleReviewStory(record.id, 'approve'),
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
                                    onOk: () => handleReviewStory(record.id, 'reject'),
                                })
                            }}
                        >
                            Reject
                        </Button>
                        <Popconfirm title="Delete?" onConfirm={async () => { await deleteStoryProposal(record.id); loadStories() }}>
                            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Space>
                )
            },
        },
    ]

    const storiesTab = (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
                    New Story Proposal
                </Button>
            </div>
            <Table
                dataSource={stories}
                columns={storyColumns}
                rowKey="id"
                loading={loading}
                size="small"
                pagination={false}
                locale={{ emptyText: <Empty description="No story proposals" /> }}
                onRow={(record) => ({
                    onClick: () => { setDetailRecord(record); setDetailOpen(true) },
                    style: { cursor: 'pointer' },
                })}
            />
        </div>
    )

    const tabItems = [
        {
            key: 'unit',
            label: <Space><FileTextOutlined />Unit Tests</Space>,
            children: <UnitTestProposalsPage projectId={projectId} />,
        },
        {
            key: 'spec',
            label: <Space><ExperimentOutlined />Spec Tests</Space>,
            children: <SpecTestProposalsPage projectId={projectId} />,
        },
        {
            key: 'story',
            label: <Badge count={pendingStory} offset={[10, 0]} size="small"><Space><BookOutlined />Stories</Space></Badge>,
            children: storiesTab,
        },
    ]

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Proposals</Title>
            </div>

            <Tabs items={tabItems} />

            {/* Create Story Modal */}
            <Modal
                title="New Story Proposal"
                open={showCreate}
                onOk={handleCreate}
                onCancel={() => { setShowCreate(false); form.resetFields() }}
                okText="Submit"
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="proposedBy" label="Proposed By" rules={[{ required: true, message: 'Required' }]}>
                        <Input placeholder="Name or identifier" />
                    </Form.Item>
                    <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Required' }]}>
                        <Input placeholder="Story title" />
                    </Form.Item>
                    <Form.Item name="enrichedText" label="Story Content">
                        <TextArea rows={4} placeholder="Story description..." />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Story Detail Drawer */}
            <Drawer
                title="Story Proposal"
                open={detailOpen}
                onClose={() => { setDetailOpen(false); setDetailRecord(null) }}
                width={600}
            >
                {detailRecord && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="ID">
                            <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>{detailRecord.id}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Title">
                            <Text strong>{detailRecord.title}</Text>
                        </Descriptions.Item>
                        {detailRecord.enrichedText && (
                            <Descriptions.Item label="Content">
                                <div style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                                    {detailRecord.enrichedText}
                                </div>
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Status">
                            <Tag color={statusColor(detailRecord.status)}>{detailRecord.status}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Proposed By">
                            {detailRecord.proposedBy}
                        </Descriptions.Item>
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
