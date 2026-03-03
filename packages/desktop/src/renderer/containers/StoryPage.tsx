import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
    Button,
    Input,
    Typography,
    Space,
    Spin,
    Drawer,
    Alert,
    Tooltip,
    Popover,
    Form,
    message,
    Empty,
} from 'antd'
import {
    SendOutlined,
    ThunderboltOutlined,
    SettingOutlined,
    CopyOutlined,
    WarningOutlined,
    UserOutlined,
    RobotOutlined,
} from '@ant-design/icons'
import type { StoryIssue } from '@ockham/shared'
import { v7 as uuidv7 } from 'uuid'
import { StoryProposalDrawer } from '../components/StoryProposalDrawer'
import { storyChat, listAiConfigs, upsertAiConfig, type StoryResponse, type TeamAiConfig } from '../api'

const { Title, Text } = Typography
const { TextArea } = Input

// ── Chat message type ─────────────────────────────────
interface ChatItem {
    id: string
    role: 'user' | 'assistant'
    content: string
    response?: StoryResponse
    originalText?: string // user's original text (for highlighting)
    loading?: boolean
}

// ── Highlighted Text component ────────────────────────
function HighlightedText({
    text,
    issues,
}: {
    text: string
    issues: StoryIssue[]
}) {
    if (!issues.length) {
        return <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>
    }

    const segments: { text: string; issue?: StoryIssue }[] = []
    let remaining = text

    const sortedIssues = [...issues].sort((a, b) => {
        const posA = text.indexOf(a.text)
        const posB = text.indexOf(b.text)
        return posA - posB
    })

    for (const issue of sortedIssues) {
        const idx = remaining.indexOf(issue.text)
        if (idx === -1) continue

        if (idx > 0) {
            segments.push({ text: remaining.substring(0, idx) })
        }
        segments.push({ text: issue.text, issue })
        remaining = remaining.substring(idx + issue.text.length)
    }
    if (remaining) {
        segments.push({ text: remaining })
    }

    return (
        <span style={{ whiteSpace: 'pre-wrap' }}>
            {segments.map((seg, i) =>
                seg.issue ? (
                    <Tooltip
                        key={i}
                        title={
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                    <WarningOutlined style={{ marginRight: 4 }} />
                                    {seg.issue.reason}
                                </div>
                                <div style={{ opacity: 0.85 }}>
                                    建议: {seg.issue.suggestion}
                                </div>
                            </div>
                        }
                        color="#faad14"
                    >
                        <span
                            style={{
                                background: 'rgba(250, 173, 20, 0.25)',
                                borderBottom: '2px wavy #faad14',
                                padding: '0 2px',
                                cursor: 'help',
                                borderRadius: 2,
                            }}
                        >
                            {seg.text}
                        </span>
                    </Tooltip>
                ) : (
                    <span key={i}>{seg.text}</span>
                )
            )}
        </span>
    )
}

// ── AI Settings Popover ───────────────────────────────
function AiSettings({ teamId }: { teamId?: string }) {
    const [configs, setConfigs] = useState<TeamAiConfig[]>([])
    const [loading, setLoading] = useState(false)
    const [apiKey, setApiKey] = useState('')
    const [baseUrl, setBaseUrl] = useState('')
    const [model, setModel] = useState('')

    useEffect(() => {
        if (teamId) {
            listAiConfigs(teamId).then((items) => {
                setConfigs(items)
                const defaultCfg = items.find((c) => c.isDefault) || items[0]
                if (defaultCfg) {
                    setApiKey(defaultCfg.apiKey || '')
                    setBaseUrl(defaultCfg.baseUrl || '')
                    setModel(defaultCfg.models?.[0] || '')
                }
            })
        }
    }, [teamId])

    const handleSave = async () => {
        if (!teamId) return
        setLoading(true)
        try {
            const existing = configs.find((c) => c.isDefault) || configs[0]
            await upsertAiConfig({
                id: existing?.id,
                teamId,
                provider: 'openai-compatible',
                apiKey,
                baseUrl: baseUrl || undefined,
                models: model ? [model] : [],
                isDefault: true,
            })
            message.success('AI settings saved')
        } catch {
            message.error('Failed to save settings')
        }
        setLoading(false)
    }

    return (
        <Form layout="vertical" style={{ width: 320 }}>
            <Form.Item label="API Key" required>
                <Input.Password
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                />
            </Form.Item>
            <Form.Item label="Base URL">
                <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.anthropic.com"
                />
            </Form.Item>
            <Form.Item label="Model">
                <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="claude-3-sonnet-20240229"
                />
            </Form.Item>
            <Button type="primary" block loading={loading} onClick={handleSave}>
                Save
            </Button>
        </Form>
    )
}

// ── Chat Bubble ───────────────────────────────────────
function ChatBubble({ item, onGeneratePrompt }: { item: ChatItem; onGeneratePrompt: (resp: StoryResponse) => void }) {
    const isUser = item.role === 'user'

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: isUser ? 'row-reverse' : 'row',
                gap: 12,
                marginBottom: 20,
                alignItems: 'flex-start',
            }}
        >
            {/* Avatar */}
            <div
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: isUser ? '#1677ff' : '#722ed1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 16,
                    flexShrink: 0,
                }}
            >
                {isUser ? <UserOutlined /> : <RobotOutlined />}
            </div>

            {/* Bubble */}
            <div
                style={{
                    maxWidth: '75%',
                    padding: '12px 16px',
                    borderRadius: isUser ? '16px 2px 16px 16px' : '2px 16px 16px 16px',
                    background: isUser
                        ? 'var(--ant-color-primary-bg)'
                        : 'var(--ant-color-bg-container)',
                    border: `1px solid ${isUser ? 'var(--ant-color-primary-border)' : 'var(--ant-color-border)'}`,
                    fontSize: 14,
                    lineHeight: 1.7,
                }}
            >
                {item.loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Spin size="small" />
                        <Text type="secondary">Thinking...</Text>
                    </div>
                ) : isUser && item.response?.issues?.length ? (
                    // User message with highlighted issues
                    <HighlightedText text={item.content} issues={item.response.issues} />
                ) : !isUser && item.response ? (
                    // Assistant message: enriched text + generate prompt button
                    <div>
                        <div style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>
                            {item.response.enrichedText}
                        </div>
                        {item.response.issues.length > 0 && (
                            <Alert
                                type="warning"
                                message={`Found ${item.response.issues.length} issue(s) — hover over your message to see details`}
                                style={{ marginBottom: 12, fontSize: 12 }}
                                showIcon
                            />
                        )}
                        <Button
                            type="primary"
                            icon={<ThunderboltOutlined />}
                            size="small"
                            onClick={() => onGeneratePrompt(item.response!)}
                        >
                            Generate Prompt
                        </Button>
                    </div>
                ) : (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{item.content}</span>
                )}
            </div>
        </div>
    )
}

// ── Main StoryPage ────────────────────────────────────
export function StoryPage({ projectId, teamId }: { projectId?: string; teamId?: string }) {
    const [messages, setMessages] = useState<ChatItem[]>([])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [promptDrawerOpen, setPromptDrawerOpen] = useState(false)
    const [currentPrompt, setCurrentPrompt] = useState('')
    const [showProposals, setShowProposals] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = useCallback(async () => {
        const text = input.trim()
        if (!text || sending) return

        const userMsg: ChatItem = {
            id: uuidv7(),
            role: 'user',
            content: text,
        }
        const loadingMsg: ChatItem = {
            id: uuidv7(),
            role: 'assistant',
            content: '',
            loading: true,
        }

        setInput('')
        setMessages((prev) => [...prev, userMsg, loadingMsg])
        setSending(true)

        try {
            const storyMessages = [{ role: 'user' as const, content: text }]
            if (!teamId) throw new Error('Team not selected')
            const result = await storyChat(teamId, storyMessages)

            setMessages((prev) => {
                const updated = prev.map((m) => {
                    if (m.id === userMsg.id) {
                        return { ...m, response: result }
                    }
                    if (m.id === loadingMsg.id) {
                        return {
                            ...m,
                            content: result.enrichedText,
                            response: result,
                            loading: false,
                        }
                    }
                    return m
                })
                return updated
            })
        } catch (err) {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === loadingMsg.id
                        ? {
                            ...m,
                            content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
                            loading: false,
                        }
                        : m
                )
            )
        }
        setSending(false)
    }, [input, sending])

    const handleGeneratePrompt = useCallback((resp: StoryResponse) => {
        setCurrentPrompt(resp.prompt)
        setPromptDrawerOpen(true)
    }, [])

    const handleCopyPrompt = useCallback(() => {
        navigator.clipboard.writeText(currentPrompt)
        message.success('Prompt copied to clipboard')
    }, [currentPrompt])

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '12px 24px',
                    borderBottom: '1px solid var(--ant-color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                }}
            >
                <Title level={4} style={{ margin: 0 }}>
                    Story
                </Title>
                <Space>
                    {projectId && (
                        <Button onClick={() => setShowProposals(true)}>
                            Pool
                        </Button>
                    )}
                    <Popover
                        content={<AiSettings teamId={teamId} />}
                        title="AI Settings"
                        trigger="click"
                        placement="bottomRight"
                    >
                        <Button type="text" icon={<SettingOutlined />} size="small">
                            AI Settings
                        </Button>
                    </Popover>
                </Space>
            </div>

            {/* Chat area */}
            <div
                style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '24px 24px 12px',
                }}
            >
                {messages.length === 0 && (
                    <Empty
                        description="Enter a feature description to begin"
                        style={{ marginTop: 80 }}
                    />
                )}
                {messages.map((item) => (
                    <ChatBubble key={item.id} item={item} onGeneratePrompt={handleGeneratePrompt} />
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input bar — fixed at bottom */}
            <div
                style={{
                    padding: '12px 24px 16px',
                    borderTop: '1px solid var(--ant-color-border)',
                    background: 'var(--ant-color-bg-container)',
                    flexShrink: 0,
                }}
            >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <TextArea
                        rows={2}
                        autoSize={{ minRows: 1, maxRows: 6 }}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe the feature you want to build..."
                        style={{ fontSize: 14 }}
                        onPressEnter={(e) => {
                            if (e.metaKey || e.ctrlKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        loading={sending}
                        onClick={handleSend}
                        disabled={!input.trim()}
                        style={{ height: 40, width: 40, flexShrink: 0 }}
                    />
                </div>
                <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                    Cmd+Enter to send
                </Text>
            </div>

            {/* Prompt Drawer */}
            <Drawer
                title={
                    <Space>
                        <ThunderboltOutlined />
                        <span>Generated Prompt</span>
                    </Space>
                }
                open={promptDrawerOpen}
                onClose={() => setPromptDrawerOpen(false)}
                width="60vw"
                extra={
                    <Button
                        type="primary"
                        icon={<CopyOutlined />}
                        onClick={handleCopyPrompt}
                    >
                        Copy
                    </Button>
                }
            >
                {currentPrompt ? (
                    <div
                        style={{
                            padding: 20,
                            background: 'var(--ant-color-bg-layout)',
                            borderRadius: 8,
                            fontFamily: 'monospace',
                            fontSize: 13,
                            lineHeight: 1.7,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    >
                        {currentPrompt}
                    </div>
                ) : (
                    <Empty description="No prompt generated yet" />
                )}
            </Drawer>

            {/* Proposals Drawer */}
            {projectId && (
                <StoryProposalDrawer
                    open={showProposals}
                    onClose={() => setShowProposals(false)}
                    projectId={projectId}
                />
            )}
        </div>
    )
}
