'use client'

import { useState, useRef, useEffect } from 'react'
import { Button, Flex, Input, Space, Spin, Typography, Avatar, message, Popconfirm, Empty } from 'antd'
import { BookOutlined, DeleteOutlined, SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons'
import { trpc } from '@/lib/trpc-client'
import { useWorkspace } from '@/lib/workspace-context'

const { Text } = Typography
const { TextArea } = Input

export default function StoriesPage() {
    const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)
    const [messageText, setMessageText] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const utils = trpc.useUtils()
    const { projectId } = useWorkspace()

    const { data: stories, isLoading } = trpc.story.list.useQuery(
        { projectId: projectId! },
        { enabled: !!projectId }
    )

    const { data: messages, isLoading: messagesLoading } = trpc.story.listMessages.useQuery(
        { storyId: selectedStoryId! },
        { enabled: !!selectedStoryId }
    )


    const deleteStory = trpc.story.delete.useMutation({
        onSuccess: () => {
            if (projectId) utils.story.list.invalidate({ projectId })
            if (selectedStoryId) setSelectedStoryId(null)
            message.success('Story deleted')
        },
    })

    const addMessage = trpc.story.addMessage.useMutation({
        onSuccess: () => {
            if (selectedStoryId) utils.story.listMessages.invalidate({ storyId: selectedStoryId })
            setMessageText('')
        },
    })

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendMessage = () => {
        if (!messageText.trim() || !selectedStoryId) return
        addMessage.mutate({
            storyId: selectedStoryId,
            role: 'user',
            content: messageText.trim(),
            order: (messages?.length ?? 0) + 1,
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-title">Stories</div>
            </div>

            {!projectId ? (
                <Empty description="Please select a project in the workspace first" />
            ) : (
                <div className="chat-container">
                    {/* Left — Story List */}
                    <div className="chat-sidebar">
                        <div className="chat-sidebar-header">
                            <Text strong style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>All Stories</Text>
                        </div>
                        <div className="chat-sidebar-list">
                            {isLoading ? (
                                <Spin style={{ display: 'block', textAlign: 'center', padding: 32 }} />
                            ) : !stories?.length ? (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No stories" style={{ padding: 24 }} />
                            ) : (
                                stories.map((story) => (
                                    <div
                                        key={story.id}
                                        className={`chat-story-item ${selectedStoryId === story.id ? 'active' : ''}`}
                                        onClick={() => setSelectedStoryId(story.id)}
                                    >
                                        <Flex justify="space-between" align="center">
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="chat-story-title">{story.title}</div>
                                                <div className="chat-story-meta">
                                                    {new Date(story.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <Popconfirm
                                                title="Delete this story?"
                                                onConfirm={(e) => { e?.stopPropagation(); deleteStory.mutate({ id: story.id }) }}
                                            >
                                                <Button
                                                    size="small"
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ opacity: 0.4 }}
                                                />
                                            </Popconfirm>
                                        </Flex>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right — Chat Area */}
                    <div className="chat-main">
                        {!selectedStoryId ? (
                            <Flex align="center" justify="center" style={{ flex: 1, color: 'var(--color-text-muted)' }}>
                                <Space orientation="vertical" align="center">
                                    <BookOutlined style={{ fontSize: 40, opacity: 0.3 }} />
                                    <Text type="secondary">Select a story to start the conversation</Text>
                                </Space>
                            </Flex>
                        ) : (
                            <>
                                <div className="chat-messages">
                                    {messagesLoading ? (
                                        <Spin style={{ margin: 'auto' }} />
                                    ) : !messages?.length ? (
                                        <Flex align="center" justify="center" style={{ flex: 1 }}>
                                            <Text type="secondary" style={{ fontSize: 13 }}>No messages yet. Send the first one!</Text>
                                        </Flex>
                                    ) : (
                                        messages.map((msg) => (
                                            <div key={msg.id} className={`chat-bubble ${msg.role}`}>
                                                <Flex gap={8} align="flex-start">
                                                    <Avatar
                                                        size={24}
                                                        icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                                                        style={{
                                                            flexShrink: 0,
                                                            background: msg.role === 'user' ? 'rgba(255,255,255,0.2)' : 'var(--color-primary)',
                                                            fontSize: 12,
                                                        }}
                                                    />
                                                    <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                                </Flex>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="chat-input-bar">
                                    <TextArea
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                                        autoSize={{ minRows: 1, maxRows: 4 }}
                                        style={{ flex: 1, borderRadius: 'var(--radius-md)' }}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<SendOutlined />}
                                        onClick={handleSendMessage}
                                        loading={addMessage.isPending}
                                        disabled={!messageText.trim()}
                                        style={{ borderRadius: 'var(--radius-md)', height: 38 }}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}


        </div>
    )
}
