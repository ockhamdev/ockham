import React, { useState, useEffect, useCallback } from 'react'
import {
    Button,
    Table,
    Tag,
    Modal,
    Input,
    Space,
    Typography,
    message,
    Popconfirm,
    Alert,
    InputNumber,
    Form,
    Tooltip,
    Empty,
} from 'antd'
import {
    PlusOutlined,
    CopyOutlined,
    KeyOutlined,
    StopOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons'
import {
    createUserToken,
    listUserTokens,
    revokeUserToken,
    deleteUserToken,
    type UserTokenListItem,
} from '../api'

const { Title, Text, Paragraph } = Typography



export function TokensPage() {
    const [tokens, setTokens] = useState<UserTokenListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [creating, setCreating] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [expiresInDays, setExpiresInDays] = useState<number | null>(null)

    // Newly created token display
    const [newRawToken, setNewRawToken] = useState<string | null>(null)

    const loadTokens = useCallback(async () => {
        setLoading(true)
        try {
            const items = await listUserTokens()
            setTokens(items)
        } catch (err) {
            message.error('Failed to load tokens')
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        loadTokens()
    }, [loadTokens])

    const handleCreate = async () => {
        if (!name.trim()) {
            message.warning('Please enter a token name')
            return
        }
        setCreating(true)
        try {
            const result = await createUserToken({
                name: name.trim(),
                expiresInDays: expiresInDays || undefined,
            })
            setNewRawToken(result.rawToken)
            await loadTokens()
            message.success('Token created')
        } catch (err) {
            message.error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
        setCreating(false)
    }

    const handleRevoke = async (id: string) => {
        try {
            await revokeUserToken(id)
            await loadTokens()
            message.success('Token revoked')
        } catch {
            message.error('Failed to revoke token')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteUserToken(id)
            await loadTokens()
            message.success('Token deleted')
        } catch {
            message.error('Failed to delete token')
        }
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        message.success('Copied to clipboard')
    }

    const closeCreateModal = () => {
        setCreateModalOpen(false)
        setNewRawToken(null)
        setName('')
        setExpiresInDays(null)
    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Token',
            dataIndex: 'tokenPrefix',
            key: 'tokenPrefix',
            render: (prefix: string) => (
                <Text code style={{ fontSize: 12 }}>{prefix}••••••••</Text>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: unknown, record: UserTokenListItem) => {
                if (record.isRevoked) {
                    return <Tag icon={<StopOutlined />} color="red">Revoked</Tag>
                }
                if (record.isExpired) {
                    return <Tag icon={<ClockCircleOutlined />} color="default">Expired</Tag>
                }
                return <Tag icon={<CheckCircleOutlined />} color="green">Active</Tag>
            },
        },
        {
            title: 'Last Used',
            dataIndex: 'lastUsedAt',
            key: 'lastUsedAt',
            render: (val: string | null) =>
                val ? <Text type="secondary">{new Date(val).toLocaleString()}</Text> : <Text type="secondary">Never</Text>,
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => <Text type="secondary">{new Date(val).toLocaleDateString()}</Text>,
        },
        {
            title: 'Expires',
            dataIndex: 'expiresAt',
            key: 'expiresAt',
            render: (val: string | null) =>
                val ? <Text type="secondary">{new Date(val).toLocaleDateString()}</Text> : <Text type="secondary">Never</Text>,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: UserTokenListItem) => (
                <Space>
                    {!record.isRevoked && !record.isExpired && (
                        <Popconfirm
                            title="Revoke this token?"
                            description="The token will no longer work for authentication."
                            onConfirm={() => handleRevoke(record.id)}
                            okText="Revoke"
                            okButtonProps={{ danger: true }}
                        >
                            <Tooltip title="Revoke">
                                <Button size="small" icon={<StopOutlined />} danger />
                            </Tooltip>
                        </Popconfirm>
                    )}
                    <Popconfirm
                        title="Delete this token permanently?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Delete">
                            <Button size="small" icon={<DeleteOutlined />} danger />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        <KeyOutlined style={{ marginRight: 8 }} />
                        API Tokens
                    </Title>
                    <Text type="secondary">Manage tokens for MCP services and API access</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                    Create Token
                </Button>
            </div>

            {tokens.length === 0 && !loading ? (
                <Empty description="No tokens yet" style={{ marginTop: 80 }}>
                    <Button type="primary" onClick={() => setCreateModalOpen(true)}>
                        Create your first token
                    </Button>
                </Empty>
            ) : (
                <Table
                    columns={columns}
                    dataSource={tokens}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    size="middle"
                />
            )}

            {/* Create Token Modal */}
            <Modal
                title="Create API Token"
                open={createModalOpen}
                onCancel={closeCreateModal}
                footer={
                    newRawToken
                        ? [<Button key="done" type="primary" onClick={closeCreateModal}>Done</Button>]
                        : undefined
                }
                onOk={newRawToken ? undefined : handleCreate}
                okText="Create"
                confirmLoading={creating}
                destroyOnClose
                maskClosable={!newRawToken}
            >
                {newRawToken ? (
                    <div>
                        <Alert
                            type="warning"
                            icon={<ExclamationCircleOutlined />}
                            message="Copy your token now"
                            description="This is the only time the token will be shown. Store it securely — you won't be able to see it again."
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                        <div
                            style={{
                                background: 'var(--ant-color-bg-container)',
                                border: '1px solid var(--ant-color-border)',
                                borderRadius: 8,
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 8,
                            }}
                        >
                            <Text code style={{ fontSize: 13, wordBreak: 'break-all', flex: 1 }}>
                                {newRawToken}
                            </Text>
                            <Button
                                type="primary"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopy(newRawToken)}
                            >
                                Copy
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Form layout="vertical">
                        <Form.Item label="Token Name" required>
                            <Input
                                placeholder="e.g. My MCP Token"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                        </Form.Item>
                        <Form.Item label="Expiration (days)">
                            <InputNumber
                                min={1}
                                max={365}
                                value={expiresInDays}
                                onChange={(val) => setExpiresInDays(val)}
                                placeholder="Leave empty for no expiration"
                                style={{ width: '100%' }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Leave empty for a token that never expires
                            </Text>
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </div>
    )
}
