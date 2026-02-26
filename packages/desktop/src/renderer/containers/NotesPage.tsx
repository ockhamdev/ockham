import React, { useState } from 'react'
import {
    Button,
    List,
    Card,
    Modal,
    Input,
    Empty,
    Popconfirm,
    Typography,
    Space,
    message,
    Spin,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons'
import { useNotes } from '../hooks/useNotes'

const { TextArea } = Input
const { Text, Paragraph } = Typography

export function NotesPage() {
    const { notes, loading, addNote, updateNote, deleteNote } = useNotes()
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    const handleOpenAdd = () => {
        setEditingId(null)
        setTitle('')
        setContent('')
        setModalOpen(true)
    }

    const handleOpenEdit = (note: { id: string; title: string; content: string }) => {
        setEditingId(note.id)
        setTitle(note.title)
        setContent(note.content)
        setModalOpen(true)
    }

    const handleSave = async () => {
        if (!title.trim()) {
            message.warning('Please enter a title')
            return
        }
        try {
            if (editingId) {
                await updateNote({ id: editingId, title, content })
                message.success('Note updated')
            } else {
                await addNote({ title, content })
                message.success('Note added')
            }
            setModalOpen(false)
        } catch {
            message.error('Failed to save note')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteNote(id)
            message.success('Note deleted')
        } catch {
            message.error('Failed to delete note')
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
                <Spin size="large" />
            </div>
        )
    }

    return (
        <div style={{ padding: 24 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Typography.Title level={3} style={{ margin: 0 }}>
                    Notes
                </Typography.Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
                    New Note
                </Button>
            </div>

            {notes.length === 0 ? (
                <Empty
                    description="No notes yet"
                    style={{ marginTop: 80 }}
                >
                    <Button type="primary" onClick={handleOpenAdd}>
                        Create your first note
                    </Button>
                </Empty>
            ) : (
                <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
                    dataSource={notes}
                    renderItem={(note) => (
                        <List.Item>
                            <Card
                                title={note.title}
                                hoverable
                                actions={[
                                    <EditOutlined
                                        key="edit"
                                        onClick={() => handleOpenEdit(note)}
                                    />,
                                    <Popconfirm
                                        key="delete"
                                        title="Delete this note?"
                                        onConfirm={() => handleDelete(note.id)}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <DeleteOutlined />
                                    </Popconfirm>,
                                ]}
                            >
                                <Paragraph
                                    ellipsis={{ rows: 3 }}
                                    style={{ marginBottom: 8 }}
                                >
                                    {note.content || 'No content'}
                                </Paragraph>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {new Date(note.updatedAt).toLocaleString()}
                                </Text>
                            </Card>
                        </List.Item>
                    )}
                />
            )}

            <Modal
                title={editingId ? 'Edit Note' : 'New Note'}
                open={modalOpen}
                onOk={handleSave}
                onCancel={() => setModalOpen(false)}
                okText="Save"
                destroyOnClose
            >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Input
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />
                    <TextArea
                        placeholder="Content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                    />
                </Space>
            </Modal>
        </div>
    )
}
