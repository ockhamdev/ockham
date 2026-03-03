import React, { useCallback, useEffect, useState } from 'react'
import {
    Button,
    Drawer,
    Table,
    Tag,
    Space,
    Modal,
    Input,
    Form,
    Typography,
    message,
    Popconfirm,
    Empty,
} from 'antd'
import {
    PlusOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { StoryProposal } from '../api'
import {
    listStoryProposals,
    createStoryProposal,
    reviewStoryProposal,
    deleteStoryProposal,
} from '../api'

const { Text } = Typography
const { TextArea } = Input

interface StoryProposalDrawerProps {
    open: boolean
    onClose: () => void
    projectId: string
    onApproved?: () => void
}

export function StoryProposalDrawer({ open, onClose, projectId, onApproved }: StoryProposalDrawerProps) {
    const [entries, setEntries] = useState<StoryProposal[]>([])
    const [loading, setLoading] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [reviewNote, setReviewNote] = useState('')
    const [form] = Form.useForm()

    const loadEntries = useCallback(async () => {
        if (!projectId) return
        setLoading(true)
        try {
            const list = await listStoryProposals(projectId)
            setEntries(list)
        } catch {
            message.error('Failed to load proposals')
        }
        setLoading(false)
    }, [projectId])

    useEffect(() => {
        if (open) loadEntries()
    }, [open, loadEntries])

    const handleCreate = useCallback(async () => {
        try {
            const values = await form.validateFields()
            await createStoryProposal({
                projectId,
                title: values.title,
                enrichedText: values.enrichedText || '',
                prompt: values.prompt || '',
                proposedBy: values.proposedBy,
            })
            message.success('Story proposal created')
            form.resetFields()
            setShowCreate(false)
            loadEntries()
        } catch {
            // validation error
        }
    }, [form, projectId, loadEntries])

    const handleReview = useCallback(async (id: string, action: 'approve' | 'reject') => {
        try {
            await reviewStoryProposal(id, action, reviewNote)
            message.success(action === 'approve' ? 'Approved — story created' : 'Rejected')
            setReviewNote('')
            loadEntries()
            if (action === 'approve' && onApproved) onApproved()
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Review failed')
        }
    }, [reviewNote, loadEntries, onApproved])

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteStoryProposal(id)
            message.success('Proposal deleted')
            loadEntries()
        } catch {
            message.error('Failed to delete proposal')
        }
    }, [loadEntries])

    const statusColor = (s: string) => {
        if (s === 'approved') return 'success'
        if (s === 'rejected') return 'error'
        return 'processing'
    }

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            width: '25%',
            ellipsis: true,
        },
        {
            title: 'Enriched Text',
            dataIndex: 'enrichedText',
            key: 'enrichedText',
            width: '20%',
            ellipsis: true,
            render: (v: string) => v || <Text type="secondary">—</Text>,
        },
        {
            title: 'Proposed By',
            dataIndex: 'proposedBy',
            key: 'proposedBy',
            width: '10%',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: '10%',
            render: (s: string) => <Tag color={statusColor(s)}>{s}</Tag>,
        },
        {
            title: 'Action',
            key: 'action',
            width: '25%',
            render: (_: unknown, record: StoryProposal) => {
                if (record.status !== 'pending') {
                    return <Text type="secondary">{record.reviewNote || '—'}</Text>
                }
                return (
                    <Space size="small">
                        <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Approve this story proposal?',
                                    icon: <ExclamationCircleOutlined />,
                                    content: (
                                        <div>
                                            <p>This will create a story from the proposal.</p>
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
                        <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
                            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Space>
                )
            },
        },
    ]

    return (
        <Drawer
            title="Story Proposals — Proposals"
            open={open}
            onClose={onClose}
            width="75%"
            extra={
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setShowCreate(true)}
                >
                    New Proposal
                </Button>
            }
        >
            <Table
                dataSource={entries}
                columns={columns}
                rowKey="id"
                loading={loading}
                size="small"
                pagination={false}
                locale={{ emptyText: <Empty description="No proposals" /> }}
            />

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
                        <TextArea rows={4} placeholder="Story description / enriched text..." />
                    </Form.Item>
                    <Form.Item name="prompt" label="Prompt (optional)">
                        <TextArea rows={2} placeholder="Original prompt or context..." />
                    </Form.Item>
                </Form>
            </Modal>
        </Drawer>
    )
}
