import React, { useEffect, useState } from 'react'
import {
    Card, Typography, Button, Input, Drawer, Form, Select,
    List, Popconfirm, Space, Spin, Empty, App as AntdApp, Tag, Tooltip,
} from 'antd'
import {
    PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
    PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, UndoOutlined,
} from '@ant-design/icons'
import {
    listIssues, createIssue, updateIssue, deleteIssue, transitionIssue,
    type Issue, type IssueStatus, type IssuePriority,
} from '../api'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

// ── Display Maps ──────────────────────────────────────

const STATUS_CONFIG: Record<IssueStatus, { label: string; color: string }> = {
    open: { label: 'Open', color: 'blue' },
    in_progress: { label: 'In Progress', color: 'orange' },
    resolved: { label: 'Resolved', color: 'green' },
    closed: { label: 'Closed', color: 'default' },
}

const PRIORITY_CONFIG: Record<IssuePriority, { label: string; color: string }> = {
    low: { label: 'Low', color: 'default' },
    medium: { label: 'Medium', color: 'blue' },
    high: { label: 'High', color: 'orange' },
    critical: { label: 'Critical', color: 'red' },
}

const TRANSITION_ACTIONS: Record<IssueStatus, { action: string; label: string; icon: React.ReactNode }[]> = {
    open: [
        { action: 'start', label: 'Start', icon: <PlayCircleOutlined /> },
    ],
    in_progress: [
        { action: 'resolve', label: 'Resolve', icon: <CheckCircleOutlined /> },
    ],
    resolved: [
        { action: 'close', label: 'Close', icon: <CloseCircleOutlined /> },
        { action: 'reopen', label: 'Reopen', icon: <UndoOutlined /> },
    ],
    closed: [
        { action: 'reopen', label: 'Reopen', icon: <UndoOutlined /> },
    ],
}

// ── Component ─────────────────────────────────────────

interface IssuesPageProps {
    projectId: string
}

export function IssuesPage({ projectId }: IssuesPageProps) {
    const [issues, setIssues] = useState<Issue[]>([])
    const [loading, setLoading] = useState(true)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
    const [searchText, setSearchText] = useState('')
    const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all')
    const [form] = Form.useForm()
    const { message } = AntdApp.useApp()

    const loadIssues = async () => {
        setLoading(true)
        try {
            const list = await listIssues(projectId)
            setIssues(list || [])
        } catch {
            setIssues([])
        }
        setLoading(false)
    }

    useEffect(() => {
        loadIssues()
    }, [projectId])

    const handleSubmit = async (values: {
        title: string; description: string; priority: IssuePriority
    }) => {
        try {
            if (editingIssue) {
                await updateIssue({
                    id: editingIssue.id,
                    title: values.title,
                    description: values.description,
                    priority: values.priority,
                })
                message.success('Issue updated')
            } else {
                await createIssue({
                    projectId,
                    title: values.title,
                    description: values.description,
                    priority: values.priority,
                })
                message.success('Issue created')
            }
            form.resetFields()
            setEditingIssue(null)
            setDrawerOpen(false)
            loadIssues()
        } catch (err: unknown) {
            message.error((err as Error).message || 'Failed to save')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteIssue(id)
            message.success('Issue deleted')
            loadIssues()
        } catch (err: unknown) {
            message.error((err as Error).message || 'Failed to delete')
        }
    }

    const handleTransition = async (id: string, action: string) => {
        try {
            await transitionIssue(id, action as 'start' | 'resolve' | 'close' | 'reopen')
            message.success('Status updated')
            loadIssues()
        } catch (err: unknown) {
            message.error((err as Error).message || 'Transition failed')
        }
    }

    const openEdit = (issue: Issue) => {
        setEditingIssue(issue)
        form.setFieldsValue({
            title: issue.title,
            description: issue.description,
            priority: issue.priority,
        })
        setDrawerOpen(true)
    }

    const openCreate = () => {
        setEditingIssue(null)
        form.resetFields()
        setDrawerOpen(true)
    }

    const filteredIssues = issues.filter((issue) => {
        const matchesSearch = !searchText ||
            issue.title.toLowerCase().includes(searchText.toLowerCase()) ||
            issue.description.toLowerCase().includes(searchText.toLowerCase())
        const matchesStatus = filterStatus === 'all' || issue.status === filterStatus
        return matchesSearch && matchesStatus
    })

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('zh-CN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit',
            })
        } catch {
            return dateStr
        }
    }

    return (
        <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Issues</Title>
                    <Text type="secondary">Track and manage project issues</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                    New Issue
                </Button>
            </div>

            <Space style={{ marginBottom: 16, width: '100%' }} styles={{ item: { flex: 1 } }}>
                <Input
                    placeholder="Search issues..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                />
                <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    style={{ width: 140 }}
                    options={[
                        { value: 'all', label: 'All Status' },
                        ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
                            value: key,
                            label: cfg.label,
                        })),
                    ]}
                />
            </Space>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
            ) : filteredIssues.length === 0 ? (
                <Empty
                    description={searchText || filterStatus !== 'all'
                        ? 'No matching issues'
                        : 'No issues yet. Create one to get started!'}
                />
            ) : (
                <List
                    dataSource={filteredIssues}
                    renderItem={(issue) => {
                        const statusCfg = STATUS_CONFIG[issue.status]
                        const priorityCfg = PRIORITY_CONFIG[issue.priority]
                        const transitions = TRANSITION_ACTIONS[issue.status]

                        return (
                            <List.Item style={{ padding: 0, marginBottom: 8, border: 'none' }}>
                                <Card
                                    hoverable
                                    size="small"
                                    style={{ width: '100%' }}
                                    title={
                                        <Space>
                                            <Tag color={priorityCfg.color}>{priorityCfg.label}</Tag>
                                            <Text strong>{issue.title}</Text>
                                        </Space>
                                    }
                                    extra={
                                        <Space size={4}>
                                            <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
                                            {transitions.map((t) => (
                                                <Tooltip title={t.label} key={t.action}>
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={t.icon}
                                                        onClick={() => handleTransition(issue.id, t.action)}
                                                    />
                                                </Tooltip>
                                            ))}
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<EditOutlined />}
                                                onClick={() => openEdit(issue)}
                                            />
                                            <Popconfirm
                                                title="Delete this issue?"
                                                onConfirm={() => handleDelete(issue.id)}
                                            >
                                                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                            </Popconfirm>
                                        </Space>
                                    }
                                >
                                    {issue.description && (
                                        <Paragraph
                                            ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}
                                            style={{ marginBottom: 4, whiteSpace: 'pre-wrap' }}
                                        >
                                            {issue.description}
                                        </Paragraph>
                                    )}
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {formatDate(issue.updatedAt)}
                                    </Text>
                                </Card>
                            </List.Item>
                        )
                    }}
                />
            )}

            <Drawer
                title={editingIssue ? 'Edit Issue' : 'New Issue'}
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setEditingIssue(null); form.resetFields() }}
                destroyOnClose
                width={520}
                extra={
                    <Space>
                        <Button onClick={() => { setDrawerOpen(false); setEditingIssue(null); form.resetFields() }}>
                            Cancel
                        </Button>
                        <Button type="primary" onClick={() => form.submit()}>
                            {editingIssue ? 'Update' : 'Create'}
                        </Button>
                    </Space>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ priority: 'medium' }}
                >
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder="e.g. Login button not working on mobile" />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <TextArea
                            rows={10}
                            placeholder="Describe the issue in detail..."
                        />
                    </Form.Item>
                    <Form.Item
                        name="priority"
                        label="Priority"
                    >
                        <Select
                            options={Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => ({
                                value: key,
                                label: cfg.label,
                            }))}
                        />
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    )
}
