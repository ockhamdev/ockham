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
    LinkOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { UnitTestProposal } from '../api'
import {
    listUnitTestProposals,
    createUnitTestProposal,
    reviewUnitTestProposal,
    deleteUnitTestProposal,
    approveLinkedTest,
} from '../api'

const { Text } = Typography
const { TextArea } = Input

/**
 * Hash utility: SHA-1 of whitespace-stripped text
 */
async function computeStrippedHash(text: string): Promise<string> {
    const stripped = text.replace(/\s/g, '')
    const data = new TextEncoder().encode(stripped)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

interface UnitTestProposalDrawerProps {
    open: boolean
    onClose: () => void
    projectId: string
    /** Current linked test results from parent page */
    linkResults: Record<string, { filePath: string; line: number }>
    /** Trigger re-fetch of main test list */
    onApproved?: () => void
}

export function UnitTestProposalDrawer({ open, onClose, projectId, linkResults, onApproved }: UnitTestProposalDrawerProps) {
    const [entries, setEntries] = useState<UnitTestProposal[]>([])
    const [loading, setLoading] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [reviewingId, setReviewingId] = useState<string | null>(null)
    const [reviewNote, setReviewNote] = useState('')
    const [form] = Form.useForm()

    const loadEntries = useCallback(async () => {
        if (!projectId) return
        setLoading(true)
        try {
            const list = await listUnitTestProposals(projectId)
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
            await createUnitTestProposal({
                projectId,
                path: values.path,
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
        try {
            // Persist link if available in local linkResults
            if (action === 'approve' && linkResults[id]) {
                try {
                    await approveLinkedTest(id, linkResults[id].filePath, '')
                } catch {
                    // link persist failed — proceed anyway
                }
            }
            await reviewUnitTestProposal(id, action, reviewNote)
            message.success(action === 'approve' ? 'Approved — test merged' : 'Rejected')
            setReviewingId(null)
            setReviewNote('')
            loadEntries()
            if (action === 'approve' && onApproved) onApproved()
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Review failed')
        }
    }, [linkResults, reviewNote, loadEntries, onApproved])

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteUnitTestProposal(id)
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
            title: 'Path',
            dataIndex: 'path',
            key: 'path',
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
            render: (_: unknown, record: UnitTestProposal) => {
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
            render: (_: unknown, record: UnitTestProposal) => {
                if (record.status !== 'pending') {
                    return <Text type="secondary">{record.reviewNote || '—'}</Text>
                }
                return (
                    <Space size="small">
                        <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            disabled={false}
                            onClick={() => {
                                setReviewingId(record.id)
                                setReviewNote('')
                                Modal.confirm({
                                    title: 'Approve this proposal?',
                                    icon: <ExclamationCircleOutlined />,
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
                                    onCancel: () => setReviewingId(null),
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
            title="Unit Test Proposals — Proposals"
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

            {/* Create modal */}
            <Modal
                title="New Unit Test Proposal"
                open={showCreate}
                onOk={handleCreate}
                onCancel={() => { setShowCreate(false); form.resetFields() }}
                okText="Submit"
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="proposedBy" label="Proposed By" rules={[{ required: true, message: 'Required' }]}>
                        <Input placeholder="Name or identifier" />
                    </Form.Item>
                    <Form.Item name="path" label="Path" rules={[{ required: true, message: 'Required' }]}>
                        <Input placeholder="src/App.tsx menuItems" style={{ fontFamily: 'monospace' }} />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <TextArea rows={3} placeholder="Test requirements..." />
                    </Form.Item>
                </Form>
            </Modal>
        </Drawer>
    )
}
