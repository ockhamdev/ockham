import React, { useCallback, useEffect, useState } from 'react'
import { Typography, Card, Tabs, Form, Input, Button, Table, Space, Switch, Tag, Popconfirm, message, Select } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

interface AiConfigRow {
    id: string
    teamId: string
    provider: string
    apiKey: string
    baseUrl: string
    models: string[]
    isDefault: boolean
}

interface TeamSettingsPageProps {
    currentTeam: { id: string; name: string; slug: string }
}

const PROVIDER_OPTIONS = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'deepseek', label: 'DeepSeek' },
    { value: 'custom', label: 'Custom' },
]

export function TeamSettingsPage({ currentTeam }: TeamSettingsPageProps) {
    const [configs, setConfigs] = useState<AiConfigRow[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form] = Form.useForm()

    const loadConfigs = useCallback(async () => {
        setLoading(true)
        try {
            const data = await window.teamAiConfigApi.list(currentTeam.id)
            setConfigs(data)
        } catch {
            message.error('Failed to load AI configs')
        }
        setLoading(false)
    }, [currentTeam.id])

    useEffect(() => {
        loadConfigs()
    }, [loadConfigs])

    const handleSave = async (values: {
        provider: string
        apiKey: string
        baseUrl?: string
        models?: string
        isDefault?: boolean
    }) => {
        try {
            const models = values.models
                ? values.models.split(',').map((m) => m.trim()).filter(Boolean)
                : []
            await window.teamAiConfigApi.upsert({
                id: editingId || undefined,
                teamId: currentTeam.id,
                provider: values.provider,
                apiKey: values.apiKey,
                baseUrl: values.baseUrl || '',
                models,
                isDefault: values.isDefault || false,
            })
            message.success(editingId ? 'Config updated' : 'Config added')
            setEditingId(null)
            form.resetFields()
            loadConfigs()
        } catch {
            message.error('Failed to save config')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await window.teamAiConfigApi.delete(id)
            message.success('Config deleted')
            loadConfigs()
        } catch {
            message.error('Failed to delete config')
        }
    }

    const handleEdit = (record: AiConfigRow) => {
        setEditingId(record.id)
        form.setFieldsValue({
            provider: record.provider,
            apiKey: record.apiKey,
            baseUrl: record.baseUrl,
            models: record.models.join(', '),
            isDefault: record.isDefault,
        })
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        form.resetFields()
    }

    const columns = [
        {
            title: 'Provider',
            dataIndex: 'provider',
            key: 'provider',
            render: (val: string) => (
                <Tag color={val === 'openai' ? 'green' : val === 'anthropic' ? 'purple' : val === 'deepseek' ? 'blue' : 'default'}>
                    {val}
                </Tag>
            ),
        },
        {
            title: 'API Key',
            dataIndex: 'apiKey',
            key: 'apiKey',
            render: (val: string) => (
                <Text code style={{ fontSize: 12 }}>
                    {val.substring(0, 8)}...{val.substring(val.length - 4)}
                </Text>
            ),
        },
        {
            title: 'Base URL',
            dataIndex: 'baseUrl',
            key: 'baseUrl',
            render: (val: string) => val || <Text type="secondary">—</Text>,
        },
        {
            title: 'Models',
            dataIndex: 'models',
            key: 'models',
            render: (models: string[]) => (
                <Space wrap size={[4, 4]}>
                    {models.length > 0
                        ? models.map((m) => <Tag key={m}>{m}</Tag>)
                        : <Text type="secondary">—</Text>}
                </Space>
            ),
        },
        {
            title: 'Default',
            dataIndex: 'isDefault',
            key: 'isDefault',
            width: 80,
            render: (val: boolean) => val ? <Tag color="blue">Yes</Tag> : null,
        },
        {
            title: '',
            key: 'actions',
            width: 100,
            render: (_: unknown, record: AiConfigRow) => (
                <Space>
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Delete this config?"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <div style={{ padding: 24, maxWidth: 960 }}>
            <Title level={3}>Team Settings</Title>
            <Tabs
                items={[
                    {
                        key: 'general',
                        label: 'General',
                        children: (
                            <Card>
                                <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Team Name</Text>
                                        <Title level={4} style={{ margin: '4px 0 0' }}>
                                            {currentTeam.name}
                                        </Title>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Slug</Text>
                                        <Paragraph code style={{ margin: '4px 0 0' }}>
                                            {currentTeam.slug}
                                        </Paragraph>
                                    </div>
                                </Space>
                            </Card>
                        ),
                    },
                    {
                        key: 'ai',
                        label: 'AI Providers',
                        children: (
                            <Space orientation="vertical" size={24} style={{ width: '100%' }}>
                                <Card
                                    title={editingId ? 'Edit AI Provider' : 'Add AI Provider'}
                                    size="small"
                                >
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleSave}
                                        initialValues={{ provider: 'openai', isDefault: false }}
                                    >
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <Form.Item
                                                name="provider"
                                                label="Provider"
                                                rules={[{ required: true }]}
                                            >
                                                <Select options={PROVIDER_OPTIONS} />
                                            </Form.Item>
                                            <Form.Item
                                                name="apiKey"
                                                label="API Key"
                                                rules={[{ required: true }]}
                                            >
                                                <Input.Password placeholder="sk-..." />
                                            </Form.Item>
                                        </div>
                                        <Form.Item name="baseUrl" label="Base URL (optional)">
                                            <Input placeholder="https://api.openai.com/v1" />
                                        </Form.Item>
                                        <Form.Item
                                            name="models"
                                            label="Models (comma-separated)"
                                        >
                                            <Input placeholder="gpt-4o, gpt-4o-mini, o3-mini" />
                                        </Form.Item>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <Form.Item name="isDefault" valuePropName="checked" style={{ margin: 0 }}>
                                                <Switch checkedChildren="Default" unCheckedChildren="Default" />
                                            </Form.Item>
                                            <Space>
                                                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                                                    {editingId ? 'Update' : 'Add'}
                                                </Button>
                                                {editingId && (
                                                    <Button icon={<CloseOutlined />} onClick={handleCancelEdit}>
                                                        Cancel
                                                    </Button>
                                                )}
                                            </Space>
                                        </div>
                                    </Form>
                                </Card>

                                <Table
                                    dataSource={configs}
                                    columns={columns}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={false}
                                    size="small"
                                    locale={{ emptyText: 'No AI providers configured yet' }}
                                />
                            </Space>
                        ),
                    },
                ]}
            />
        </div>
    )
}
