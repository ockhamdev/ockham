import React, { useCallback, useEffect, useState } from 'react'
import { Card, Tabs, Typography, Form, Input, Button, Table, Popconfirm, Switch, Space, Spin, App as AntdApp, Tag, Alert } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, UndoOutlined, SaveOutlined } from '@ant-design/icons'
import {
    listAiConfigs, upsertAiConfig, deleteAiConfig, type TeamAiConfig, type Team,
    getPromptTemplate, savePromptTemplate, resetPromptTemplate, type PromptTemplateType,
} from '../api'

const { Title, Text } = Typography
const { TextArea } = Input

// ── Available variables reference ──

const UNIT_TEST_VARIABLES = [
    { name: '{{testId}}', desc: 'Test case ID' },
    { name: '{{filePath}}', desc: 'Source file path' },
    { name: '{{keyword}}', desc: 'Syntax unit keyword' },
    { name: '{{description}}', desc: 'Test requirements' },
    { name: '{{sourceSnippet}}', desc: 'Source code of the syntax unit' },
]

const SPEC_TEST_VARIABLES = [
    { name: '{{testId}}', desc: 'Spec test ID' },
    { name: '{{title}}', desc: 'Spec test title' },
    { name: '{{groupPath}}', desc: 'Group hierarchy path (e.g. Auth › Login)' },
    { name: '{{preconditionSection}}', desc: 'Inherited group preconditions (markdown)' },
    { name: '{{requirementsSection}}', desc: 'Test requirements section (markdown)' },
    { name: '{{sourceSnippets}}', desc: 'All referenced syntax units\' source code' },
]

// ── Prompt Template Editor sub-component ──

function PromptTemplateEditor({ teamId, type, label }: { teamId: string; type: PromptTemplateType; label: string }) {
    const [template, setTemplate] = useState('')
    const [isCustom, setIsCustom] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { message } = AntdApp.useApp()

    const variables = type === 'unit_test' ? UNIT_TEST_VARIABLES : SPEC_TEST_VARIABLES

    const loadTemplate = useCallback(async () => {
        setLoading(true)
        try {
            const result = await getPromptTemplate(teamId, type)
            setTemplate(result.template)
            setIsCustom(result.isCustom)
        } catch {
            setTemplate('')
        }
        setLoading(false)
    }, [teamId, type])

    useEffect(() => { loadTemplate() }, [loadTemplate])

    const handleSave = async () => {
        setSaving(true)
        try {
            await savePromptTemplate(teamId, type, template)
            setIsCustom(true)
            message.success(`${label} template saved`)
        } catch (err: unknown) {
            message.error((err as Error).message || 'Failed to save')
        }
        setSaving(false)
    }

    const handleReset = async () => {
        setSaving(true)
        try {
            const result = await resetPromptTemplate(teamId, type)
            setTemplate(result.template)
            setIsCustom(false)
            message.success(`${label} template reset to default`)
        } catch (err: unknown) {
            message.error((err as Error).message || 'Failed to reset')
        }
        setSaving(false)
    }

    if (loading) {
        return <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
    }

    return (
        <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <Text strong>{label} Prompt Template</Text>
                        {isCustom ? (
                            <Tag color="blue">Custom</Tag>
                        ) : (
                            <Tag color="default">Default</Tag>
                        )}
                    </Space>
                    <Space>
                        {isCustom && (
                            <Popconfirm title="Reset to default template?" onConfirm={handleReset}>
                                <Button size="small" icon={<UndoOutlined />} loading={saving}>
                                    Reset
                                </Button>
                            </Popconfirm>
                        )}
                        <Button type="primary" size="small" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
                            Save
                        </Button>
                    </Space>
                </div>
                <TextArea
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    rows={24}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
            </div>
            <div style={{ width: 240, flexShrink: 0 }}>
                <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Available Variables
                </Text>
                <div style={{
                    background: 'var(--ant-color-bg-layout)',
                    borderRadius: 8,
                    border: '1px solid var(--ant-color-border)',
                    padding: 12,
                }}>
                    {variables.map((v) => (
                        <div key={v.name} style={{ marginBottom: 8 }}>
                            <Text code style={{ fontSize: 11 }}>{v.name}</Text>
                            <div>
                                <Text type="secondary" style={{ fontSize: 11 }}>{v.desc}</Text>
                            </div>
                        </div>
                    ))}
                </div>
                <Alert
                    type="info"
                    showIcon
                    style={{ marginTop: 12, fontSize: 12 }}
                    message="Use {{variable}} syntax in the template. Variables will be replaced when generating prompts."
                />
            </div>
        </div>
    )
}

// ── Main Component ──

interface TeamSettingsPageProps {
    currentTeam: Team
}

export function TeamSettingsPage({ currentTeam }: TeamSettingsPageProps) {
    const [configs, setConfigs] = useState<TeamAiConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form] = Form.useForm()
    const { message } = AntdApp.useApp()

    const loadConfigs = async () => {
        setLoading(true)
        try {
            const list = await listAiConfigs(currentTeam.id)
            setConfigs(list || [])
        } catch {
            setConfigs([])
        }
        setLoading(false)
    }

    useEffect(() => {
        loadConfigs()
    }, [currentTeam.id])

    const handleSubmit = async (values: { provider: string; apiKey: string; baseUrl?: string; models?: string; isDefault?: boolean }) => {
        try {
            await upsertAiConfig({
                id: editingId || undefined,
                teamId: currentTeam.id,
                provider: values.provider,
                apiKey: values.apiKey,
                baseUrl: values.baseUrl || undefined,
                models: values.models ? values.models.split(',').map((m) => m.trim()).filter(Boolean) : [],
                isDefault: values.isDefault || false,
            })
            message.success(editingId ? 'Provider updated' : 'Provider added')
            form.resetFields()
            setEditingId(null)
            loadConfigs()
        } catch (err: unknown) {
            message.error((err as Error).message || 'Failed to save')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteAiConfig(id)
            message.success('Provider removed')
            loadConfigs()
        } catch (err: unknown) {
            message.error((err as Error).message || 'Failed to delete')
        }
    }

    const handleEdit = (record: TeamAiConfig) => {
        setEditingId(record.id)
        form.setFieldsValue({
            provider: record.provider,
            apiKey: record.apiKey,
            baseUrl: record.baseUrl || '',
            models: record.models?.join(', ') || '',
            isDefault: record.isDefault,
        })
    }

    const columns = [
        { title: 'Provider', dataIndex: 'provider', key: 'provider' },
        {
            title: 'API Key',
            dataIndex: 'apiKey',
            key: 'apiKey',
            render: (key: string) => key ? `${key.slice(0, 8)}...` : '-',
        },
        { title: 'Base URL', dataIndex: 'baseUrl', key: 'baseUrl', render: (v: string) => v || '-' },
        {
            title: 'Models',
            dataIndex: 'models',
            key: 'models',
            render: (models: string[]) => models?.length ? models.join(', ') : '-',
        },
        {
            title: 'Default',
            dataIndex: 'isDefault',
            key: 'isDefault',
            render: (v: boolean) => v ? 'Yes' : 'No',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: TeamAiConfig) => (
                <Space>
                    <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm title="Delete this provider?" onConfirm={() => handleDelete(record.id)}>
                        <Button type="link" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
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
                                        <div>
                                            <Text code>{currentTeam.slug}</Text>
                                        </div>
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
                                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                                        <Form.Item name="provider" label="Provider" rules={[{ required: true }]}>
                                            <Input placeholder="e.g. OpenAI, Anthropic, Azure" />
                                        </Form.Item>
                                        <Form.Item name="apiKey" label="API Key" rules={[{ required: true }]}>
                                            <Input.Password placeholder="sk-..." />
                                        </Form.Item>
                                        <Form.Item name="baseUrl" label="Base URL (optional)">
                                            <Input placeholder="https://api.openai.com/v1" />
                                        </Form.Item>
                                        <Form.Item name="models" label="Models (comma-separated)">
                                            <Input placeholder="gpt-4, gpt-3.5-turbo" />
                                        </Form.Item>
                                        <Form.Item name="isDefault" label="Default Provider" valuePropName="checked">
                                            <Switch />
                                        </Form.Item>
                                        <Space>
                                            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                                                {editingId ? 'Update' : 'Add'}
                                            </Button>
                                            {editingId && (
                                                <Button onClick={() => { setEditingId(null); form.resetFields() }}>
                                                    Cancel
                                                </Button>
                                            )}
                                        </Space>
                                    </Form>
                                </Card>

                                <Card title="Configured Providers" size="small">
                                    {loading ? (
                                        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
                                    ) : (
                                        <Table
                                            dataSource={configs}
                                            columns={columns}
                                            rowKey="id"
                                            pagination={false}
                                            size="small"
                                        />
                                    )}
                                </Card>
                            </Space>
                        ),
                    },
                    {
                        key: 'prompts',
                        label: 'Prompt Templates',
                        children: (
                            <Tabs
                                type="card"
                                items={[
                                    {
                                        key: 'unit_test',
                                        label: 'Unit Test',
                                        children: (
                                            <PromptTemplateEditor
                                                teamId={currentTeam.id}
                                                type="unit_test"
                                                label="Unit Test"
                                            />
                                        ),
                                    },
                                    {
                                        key: 'spec_test',
                                        label: 'Spec Test',
                                        children: (
                                            <PromptTemplateEditor
                                                teamId={currentTeam.id}
                                                type="spec_test"
                                                label="Spec Test"
                                            />
                                        ),
                                    },
                                ]}
                            />
                        ),
                    },
                ]}
            />
        </div>
    )
}
