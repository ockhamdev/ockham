import React, { useEffect, useState } from 'react'
import {
    Card, Typography, Button, Input, Modal, Form,
    List, Popconfirm, Space, Spin, Empty, App as AntdApp, Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import {
    listKnowledgeEntries, createKnowledgeEntry,
    updateKnowledgeEntry, deleteKnowledgeEntry,
    type KnowledgeEntry, type Team,
} from '../api'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface KnowledgeBasePageProps {
    currentTeam: Team
}

export function KnowledgeBasePage({ currentTeam }: KnowledgeBasePageProps) {
    const [entries, setEntries] = useState<KnowledgeEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null)
    const [searchText, setSearchText] = useState('')
    const [form] = Form.useForm()
    const { message } = AntdApp.useApp()

    const loadEntries = async () => {
        setLoading(true)
        try {
            const list = await listKnowledgeEntries(currentTeam.id)
            setEntries(list || [])
        } catch {
            setEntries([])
        }
        setLoading(false)
    }

    useEffect(() => {
        loadEntries()
    }, [currentTeam.id])

    const handleSubmit = async (values: { title: string; content: string }) => {
        try {
            if (editingEntry) {
                await updateKnowledgeEntry({
                    id: editingEntry.id,
                    title: values.title,
                    content: values.content,
                })
                message.success('Entry updated')
            } else {
                await createKnowledgeEntry({
                    teamId: currentTeam.id,
                    title: values.title,
                    content: values.content,
                })
                message.success('Entry created')
            }
            form.resetFields()
            setEditingEntry(null)
            setModalOpen(false)
            loadEntries()
        } catch (err: unknown) {
            message.error((err as Error).message || 'Failed to save')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteKnowledgeEntry(id)
            message.success('Entry deleted')
            loadEntries()
        } catch (err: unknown) {
            message.error((err as Error).message || 'Failed to delete')
        }
    }

    const openEdit = (entry: KnowledgeEntry) => {
        setEditingEntry(entry)
        form.setFieldsValue({ title: entry.title, content: entry.content })
        setModalOpen(true)
    }

    const openCreate = () => {
        setEditingEntry(null)
        form.resetFields()
        setModalOpen(true)
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
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Knowledge Base</Title>
                    <Text type="secondary">{currentTeam.name} — team knowledge entries</Text>
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

            <Modal
                title={editingEntry ? 'Edit Entry' : 'New Entry'}
                open={modalOpen}
                onCancel={() => { setModalOpen(false); setEditingEntry(null); form.resetFields() }}
                footer={null}
                destroyOnClose
                width={640}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder="e.g. API Conventions, Deployment Guide..." />
                    </Form.Item>
                    <Form.Item
                        name="content"
                        label="Content"
                    >
                        <TextArea
                            rows={10}
                            placeholder="Write your knowledge entry content here..."
                        />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => { setModalOpen(false); setEditingEntry(null); form.resetFields() }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingEntry ? 'Update' : 'Create'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
