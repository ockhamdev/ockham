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
    Tooltip,
    Empty,
} from 'antd'
import {
    PlusOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { SpecTestProposal } from '../api'
import {
    listSpecTestProposals,
    createSpecTestProposal,
    reviewSpecTestProposal,
    deleteSpecTestProposal,
} from '../api'

const { Text } = Typography
const { TextArea } = Input

interface SpecTestProposalDrawerProps {
    open: boolean
    onClose: () => void
    projectId: string
    onApproved?: () => void
}

export function SpecTestProposalDrawer({ open, onClose, projectId, onApproved }: SpecTestProposalDrawerProps) {
    const [entries, setEntries] = useState<SpecTestProposal[]>([])
    const [loading, setLoading] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [reviewNote, setReviewNote] = useState('')
    const [form] = Form.useForm()

    const loadEntries = useCallback(async () => {
        if (!projectId) return
        setLoading(true)
        try {
            const list = await listSpecTestProposals(projectId)
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
            await createSpecTestProposal({
                projectId,
                title: values.title,
                description: values.description || '',
                proposedBy: values.proposedBy,
            })
            message.success('Proposal created')
            form.resetFields()
            setShowCreate(false)
            loadEntries()
        } catch {
            // validation error
        }
    }, [form, projectId, loadEntries])

    const handleReview = useCallback(async (id: string, action: 'approve' | 'reject') => {
        if (action === 'approve') {
            const entry = entries.find(e => e.id === id)
            if (entry && !entry.linkedFilePath) {
                message.warning('此提议还未 Link 到测试实现文件，请先 Link 后再审批')
                return
            }
        }
        try {
            await reviewSpecTestProposal(id, action, reviewNote)
            message.success(action === 'approve' ? 'Approved — spec test merged' : 'Rejected')
            setReviewNote('')
            loadEntries()
            if (action === 'approve' && onApproved) onApproved()
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Review failed')
        }
    }, [entries, reviewNote, loadEntries, onApproved])

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteSpecTestProposal(id)
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
            width: '20%',
            ellipsis: true,
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: '25%',
            ellipsis: true,
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
            title: 'Linked',
            key: 'linked',
            width: '10%',
            render: (_: unknown, record: SpecTestProposal) => {
                if (record.linkedFilePath) {
                    return (
                        <Tooltip title={record.linkedFilePath}>
                            <Tag icon={<CheckCircleOutlined />} color="success">Linked</Tag>
                        </Tooltip>
                    )
                }
                return <Tag color="default">Not linked</Tag>
            },
        },
        {
            title: 'Action',
            key: 'action',
            width: '25%',
            render: (_: unknown, record: SpecTestProposal) => {
                if (record.status !== 'pending') {
                    return <Text type="secondary">{record.reviewNote || '—'}</Text>
                }
                return (
                    <Space size="small">
                        <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            disabled={!record.linkedFilePath}
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Approve this proposal?',
                                    icon: <ExclamationCircleOutlined />,
                                    content: (
                                        <div>
                                            <p>This will create a spec test from the proposal.</p>
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
            title="Spec Test Proposals — Proposals"
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
                title="New Spec Test Proposal"
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
                        <Input placeholder="Test case title" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <TextArea rows={3} placeholder="Test requirements..." />
                    </Form.Item>
                </Form>
            </Modal>
        </Drawer>
    )
}
