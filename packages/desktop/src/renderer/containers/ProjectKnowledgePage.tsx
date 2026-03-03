import React, { useEffect, useState } from 'react'
import {
    Card, Typography, Button, Input, Drawer, Form,
    List, Popconfirm, Space, Spin, Empty, App as AntdApp, Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import {
    listProjectKnowledge, createProjectKnowledge,
    updateProjectKnowledge, deleteProjectKnowledge,
    type ProjectKnowledgeEntry,
} from '../api'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface ProjectKnowledgePageProps {
    projectId: string
}

export function ProjectKnowledgePage({ projectId }: ProjectKnowledgePageProps) {
    const [entries, setEntries] = useState<ProjectKnowledgeEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editingEntry, setEditingEntry] = useState<ProjectKnowledgeEntry | null>(null)
    const [searchText, setSearchText] = useState('')
    const [form] = Form.useForm()
    const { message } = AntdApp.useApp()

    const loadEntries = async () => {
        setLoading(true)
        try {
            const list = await listProjectKnowledge(projectId)
            setEntries(list || [])
        } catch {
            setEntries([])
        }
        setLoading(false)
    }

    useEffect(() => {
        loadEntries()
    }, [projectId])

    const handleSubmit = async (values: { title: string; content: string }) => {
        try {
            if (editingEntry) {
                await updateProjectKnowledge({
                    id: editingEntry.id,
                    title: values.title,
                    content: values.content,
                })
                message.success('Entry updated')
            } else {
                await createProjectKnowledge({
                    projectId,
                    title: values.title,
                    content: values.content,
                })
                message.success('Entry created')
            }
            form.resetFields()
            setEditingEntry(null)
            setDrawerOpen(false)
            loadEntries()
        } catch (err: unknown) {
            message.error((err as Error).message || 'Failed to save')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteProjectKnowledge(id)
            message.success('Entry deleted')
            loadEntries()
        } catch (err: unknown) {
            message.error((err as Error).message || 'Failed to delete')
        }
    }

    const openEdit = (entry: ProjectKnowledgeEntry) => {
        setEditingEntry(entry)
        form.setFieldsValue({ title: entry.title, content: entry.content })
        setDrawerOpen(true)
    }

    const openCreate = () => {
        setEditingEntry(null)
        form.resetFields()
        setDrawerOpen(true)
    }

    const filteredEntries = searchText
        ? entries.filter((e) =>
            e.title.toLowerCase().includes(searchText.toLowerCase()) ||
            e.content.toLowerCase().includes(searchText.toLowerCase())
        )
        : entries

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
                    <Title level={3} style={{ margin: 0 }}>Project Knowledge</Title>
                    <Text type="secondary">Document project-specific knowledge and conventions</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                    New Entry
                </Button>
            </div>

            <Input
                placeholder="Search entries..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ marginBottom: 16 }}
            />

            {loading ? (
                <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
            ) : filteredEntries.length === 0 ? (
                <Empty
                    description={searchText ? 'No matching entries' : 'No entries yet. Create one to get started!'}
                />
            ) : (
                <List
                    grid={{ gutter: 16, column: 1 }}
                    dataSource={filteredEntries}
                    renderItem={(entry) => (
                        <List.Item>
                            <Card
                                hoverable
                                size="small"
                                title={
                                    <Space>
                                        <Text strong>{entry.title}</Text>
                                    </Space>
                                }
                                extra={
                                    <Space>
                                        <Tag color="default" style={{ fontSize: 11 }}>
                                            {formatDate(entry.updatedAt)}
                                        </Tag>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => openEdit(entry)}
                                        />
                                        <Popconfirm
                                            title="Delete this entry?"
                                            onConfirm={() => handleDelete(entry.id)}
                                        >
                                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </Space>
                                }
                            >
                                <Paragraph
                                    ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                                    style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}
                                >
                                    {entry.content || '(empty)'}
                                </Paragraph>
                            </Card>
                        </List.Item>
                    )}
                />
            )}

            <Drawer
                title={editingEntry ? 'Edit Entry' : 'New Entry'}
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setEditingEntry(null); form.resetFields() }}
                destroyOnClose
                width={520}
                extra={
                    <Space>
                        <Button onClick={() => { setDrawerOpen(false); setEditingEntry(null); form.resetFields() }}>
                            Cancel
                        </Button>
                        <Button type="primary" onClick={() => form.submit()}>
                            {editingEntry ? 'Update' : 'Create'}
                        </Button>
                    </Space>
                }
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder="e.g. API Conventions, Architecture Decisions..." />
                    </Form.Item>
                    <Form.Item
                        name="content"
                        label="Content"
                    >
                        <TextArea
                            rows={16}
                            placeholder="Write your knowledge entry content here..."
                        />
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    )
}
