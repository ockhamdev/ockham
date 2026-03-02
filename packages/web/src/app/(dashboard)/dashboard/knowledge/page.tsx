'use client'

import { useState } from 'react'
import { Button, Card, Flex, Form, Input, Modal, Space, Spin, Typography, message, Popconfirm, Empty } from 'antd'
import { PlusOutlined, ReadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { trpc } from '@/lib/trpc-client'
import { useWorkspace } from '@/lib/workspace-context'

const { Text } = Typography
const { TextArea } = Input

export default function KnowledgePage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingNote, setEditingNote] = useState<{ id: string; title: string; content: string } | null>(null)
    const [form] = Form.useForm()
    const utils = trpc.useUtils()
    const { projectId } = useWorkspace()

    const { data: notes, isLoading } = trpc.note.list.useQuery(
        { projectId: projectId! },
        { enabled: !!projectId }
    )

    const createNote = trpc.note.create.useMutation({
        onSuccess: () => {
            if (projectId) utils.note.list.invalidate({ projectId })
            setIsModalOpen(false)
            form.resetFields()
            message.success('Knowledge created')
        },
    })

    const updateNote = trpc.note.update.useMutation({
        onSuccess: () => {
            if (projectId) utils.note.list.invalidate({ projectId })
            setEditingNote(null)
            form.resetFields()
            message.success('Knowledge updated')
        },
    })

    const deleteNote = trpc.note.delete.useMutation({
        onSuccess: () => {
            if (projectId) utils.note.list.invalidate({ projectId })
            message.success('Knowledge deleted')
        },
    })

    const openEdit = (note: { id: string; title: string; content: string }) => {
        setEditingNote(note)
        form.setFieldsValue({ title: note.title, content: note.content })
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-title">Knowledge</div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { form.resetFields(); setIsModalOpen(true) }}
                    disabled={!projectId}
                >
                    New
                </Button>
            </div>

            {!projectId ? (
                <Empty description="Please select a project in the workspace first" />
            ) : isLoading ? (
                <Spin style={{ display: 'block', textAlign: 'center', padding: 48 }} />
            ) : !notes?.length ? (
                <Empty description="No knowledge entries yet" />
            ) : (
                <Flex vertical gap={8}>
                    {notes.map((note) => (
                        <Card key={note.id} size="small" hoverable style={{ borderRadius: 'var(--radius-md)' }}>
                            <Flex justify="space-between" align="flex-start">
                                <Flex gap={12} align="flex-start" style={{ flex: 1, minWidth: 0 }}>
                                    <ReadOutlined style={{ fontSize: 18, color: 'var(--color-primary)', marginTop: 3 }} />
                                    <Space orientation="vertical" size={2} style={{ flex: 1, minWidth: 0 }}>
                                        <Text strong style={{ fontSize: 14 }}>{note.title}</Text>
                                        <Text type="secondary" ellipsis style={{ maxWidth: 600, fontSize: 13 }}>
                                            {note.content || '(empty)'}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                            {new Date(note.updatedAt).toLocaleString()}
                                        </Text>
                                    </Space>
                                </Flex>
                                <Space>
                                    <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(note)} />
                                    <Popconfirm title="Delete this entry?" onConfirm={() => deleteNote.mutate({ id: note.id })}>
                                        <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                </Space>
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            )}

            <Modal title="New Knowledge" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={createNote.isPending}>
                <Form form={form} layout="vertical" onFinish={(v) => projectId && createNote.mutateAsync({ ...v, projectId })}>
                    <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                        <Input placeholder="Title" />
                    </Form.Item>
                    <Form.Item name="content" label="Content">
                        <TextArea placeholder="Content..." rows={6} />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title="Edit Knowledge" open={!!editingNote} onCancel={() => setEditingNote(null)} onOk={() => form.submit()} confirmLoading={updateNote.isPending}>
                <Form form={form} layout="vertical" onFinish={(v) => editingNote && updateNote.mutateAsync({ id: editingNote.id, ...v })}>
                    <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="content" label="Content">
                        <TextArea rows={6} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
