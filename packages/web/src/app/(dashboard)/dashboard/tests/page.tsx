'use client'

import { useState } from 'react'
import { Button, Card, Drawer, Flex, Form, Input, Space, Spin, Tag, Typography, message, Popconfirm, Empty } from 'antd'
import { PlusOutlined, ExperimentOutlined, DeleteOutlined } from '@ant-design/icons'
import { trpc } from '@/lib/trpc-client'
import { useWorkspace } from '@/lib/workspace-context'

const { Text } = Typography
const { TextArea } = Input

export default function UnitTestsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form] = Form.useForm()
    const utils = trpc.useUtils()
    const { projectId } = useWorkspace()

    const { data: testCases, isLoading } = trpc.testCase.list.useQuery(
        { projectId: projectId! },
        { enabled: !!projectId }
    )

    const createTestCase = trpc.testCase.create.useMutation({
        onSuccess: () => {
            if (projectId) utils.testCase.list.invalidate({ projectId })
            setIsModalOpen(false)
            form.resetFields()
            message.success('Test case created')
        },
    })

    const deleteTestCase = trpc.testCase.delete.useMutation({
        onSuccess: () => {
            if (projectId) utils.testCase.list.invalidate({ projectId })
            message.success('Test case deleted')
        },
    })

    return (
        <div>
            <div className="page-header">
                <div className="page-title">Unit Tests</div>
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
            ) : !testCases?.length ? (
                <Empty description="No unit tests yet" />
            ) : (
                <Flex vertical gap={8}>
                    {testCases.map((tc) => (
                        <Card key={tc.id} size="small" hoverable style={{ borderRadius: 'var(--radius-md)' }}>
                            <Flex justify="space-between" align="flex-start">
                                <Flex gap={12} align="flex-start" style={{ flex: 1, minWidth: 0 }}>
                                    <ExperimentOutlined style={{ fontSize: 18, color: 'var(--color-success)', marginTop: 3 }} />
                                    <Space orientation="vertical" size={2} style={{ flex: 1, minWidth: 0 }}>
                                        <Text code style={{ fontSize: 13 }}>{tc.path}</Text>
                                        <Text type="secondary" ellipsis style={{ maxWidth: 600, fontSize: 12 }}>
                                            {tc.description || '(no description)'}
                                        </Text>
                                        {tc.contentHash && <Tag style={{ fontSize: 11 }}>{tc.contentHash.slice(0, 12)}...</Tag>}
                                    </Space>
                                </Flex>
                                <Popconfirm title="Delete this test?" onConfirm={() => deleteTestCase.mutate({ id: tc.id })}>
                                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            )}

            <Drawer title="New Test Case" open={isModalOpen} onClose={() => setIsModalOpen(false)} size="large" extra={<Button type="primary" onClick={() => form.submit()} loading={createTestCase.isPending}>Submit</Button>}>
                <Form form={form} layout="vertical" onFinish={(v) => projectId && createTestCase.mutateAsync({ ...v, projectId })}>
                    <Form.Item name="path" label="Path" rules={[{ required: true }]}>
                        <Input placeholder="src/App.tsx const CodePage" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <TextArea placeholder="Description..." rows={6} />
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    )
}
