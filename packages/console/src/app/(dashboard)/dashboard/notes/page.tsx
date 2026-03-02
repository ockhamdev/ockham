'use client'

import { useState } from 'react'
import { Button, Card, Flex, Form, Input, Modal, Select, Typography, Space, Spin, message, Popconfirm, Empty } from 'antd'
import { PlusOutlined, FileTextOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { trpc } from '@/lib/trpc-client'

const { Title, Text } = Typography
const { TextArea } = Input

export default function NotesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingNote, setEditingNote] = useState<{ id: string; title: string; content: string } | null>(null)
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [form] = Form.useForm()
    const utils = trpc.useUtils()

    const { data: teams } = trpc.team.list.useQuery()
    const firstTeamId = teams?.[0]?.id
    const { data: projects } = trpc.project.list.useQuery(
        { teamId: firstTeamId! },
        { enabled: !!firstTeamId }
    )

    const { data: notes, isLoading } = trpc.note.list.useQuery(
        { projectId: selectedProjectId! },
        { enabled: !!selectedProjectId }
    )

    const createNote = trpc.note.create.useMutation({
        onSuccess: () => {
            if (selectedProjectId) utils.note.list.invalidate({ projectId: selectedProjectId })
            setIsModalOpen(false)
            form.resetFields()
            message.success('Note created')
        },
    })

    const updateNote = trpc.note.update.useMutation({
        onSuccess: () => {
            if (selectedProjectId) utils.note.list.invalidate({ projectId: selectedProjectId })
            setEditingNote(null)
            form.resetFields()
            message.success('Note updated')
        },
    })

    const deleteNote = trpc.note.delete.useMutation({
        onSuccess: () => {
            if (selectedProjectId) utils.note.list.invalidate({ projectId: selectedProjectId })
            message.success('Note deleted')
        },
    })

    const handleCreate = async (values: { title: string; content: string }) => {
        if (!selectedProjectId) return
        await createNote.mutateAsync({ ...values, projectId: selectedProjectId })
    }

    const handleUpdate = async (values: { title: string; content: string }) => {
        if (!editingNote) return
        await updateNote.mutateAsync({ id: editingNote.id, ...values })
    }

    const openEdit = (note: { id: string; title: string; content: string }) => {
        setEditingNote(note)
        form.setFieldsValue({ title: note.title, content: note.content })
    }

    // Auto-select first project
    if (projects?.length && !selectedProjectId) {
        setSelectedProjectId(projects[0].id)
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>Notes</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { form.resetFields(); setIsModalOpen(true) }}
                    disabled={!selectedProjectId}
                >
                    New Note
                </Button>
            </div>

            {projects && projects.length > 0 && (
                <Select
                    value={selectedProjectId}
                    onChange={setSelectedProjectId}
                    style={{ width: 240, marginBottom: 16 }}
                    options={projects.map((p) => ({ value: p.id, label: p.name }))}
                    placeholder="Select Project"
                />
            )}

            {!projects?.length ? (
                <Empty description="Please create a project first" />
            ) : isLoading ? (
                <Spin style={{ display: 'block', textAlign: 'center', padding: 48 }} />
            ) : !notes?.length ? (
                <Empty description="No notes yet" />
            ) : (
                <Flex vertical gap={8}>
                    {notes.map((note) => (
                        <Card key={note.id} size="small" hoverable>
                            <Flex justify="space-between" align="flex-start">
                                <Flex gap={12} align="flex-start" style={{ flex: 1, minWidth: 0 }}>
                                    <FileTextOutlined style={{ fontSize: 20, color: '#1677ff', marginTop: 2 }} />
                                    <Space orientation="vertical" size={2} style={{ flex: 1, minWidth: 0 }}>
                                        <Text strong>{note.title}</Text>
                                        <Text type="secondary" ellipsis style={{ maxWidth: 600 }}>
                                            {note.content || '(empty)'}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {new Date(note.updatedAt).toLocaleString()}
                                        </Text>
                                    </Space>
                                </Flex>
                                <Space>
                                    <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(note)} />
                                    <Popconfirm title="Delete this note?" onConfirm={() => deleteNote.mutate({ id: note.id })}>
                                        <Button type="text" danger icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                </Space>
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            )}

            {/* Create Modal */}
            <Modal
                title="New Note"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={createNote.isPending}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate}>
                    <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter a title' }]}>
                        <Input placeholder="Note title" />
                    </Form.Item>
                    <Form.Item name="content" label="Content">
                        <TextArea placeholder="Content..." rows={6} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                title="Edit Note"
                open={!!editingNote}
                onCancel={() => setEditingNote(null)}
                onOk={() => form.submit()}
                confirmLoading={updateNote.isPending}
            >
                <Form form={form} layout="vertical" onFinish={handleUpdate}>
                    <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter a title' }]}>
                        <Input placeholder="Note title" />
                    </Form.Item>
                    <Form.Item name="content" label="Content">
                        <TextArea placeholder="Content..." rows={6} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
