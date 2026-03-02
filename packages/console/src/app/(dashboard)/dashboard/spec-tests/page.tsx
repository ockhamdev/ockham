'use client'

import { useState } from 'react'
import { Button, Card, Drawer, Flex, Form, Input, Space, Spin, Typography, message, Popconfirm, Empty } from 'antd'
import { PlusOutlined, FileProtectOutlined, DeleteOutlined } from '@ant-design/icons'
import { trpc } from '@/lib/trpc-client'
import { useWorkspace } from '@/lib/workspace-context'

const { Text } = Typography
const { TextArea } = Input

export default function SpecTestsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form] = Form.useForm()
    const utils = trpc.useUtils()
    const { projectId } = useWorkspace()

    const { data: specTests, isLoading } = trpc.testCase.listSpecTests.useQuery(
        { projectId: projectId! },
        { enabled: !!projectId }
    )

    const createSpecTest = trpc.testCase.createSpecTest.useMutation({
        onSuccess: () => {
            if (projectId) utils.testCase.listSpecTests.invalidate({ projectId })
            setIsModalOpen(false)
            form.resetFields()
            message.success('Spec test created')
        },
    })

    const deleteSpecTest = trpc.testCase.deleteSpecTest.useMutation({
        onSuccess: () => {
            if (projectId) utils.testCase.listSpecTests.invalidate({ projectId })
            message.success('Spec test deleted')
        },
    })

    return (
        <div>
            <div className="page-header">
                <div className="page-title">Spec Tests</div>
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
            ) : !specTests?.length ? (
                <Empty description="No spec tests yet" />
            ) : (
                <Flex vertical gap={8}>
                    {specTests.map((st) => (
                        <Card key={st.id} size="small" hoverable style={{ borderRadius: 'var(--radius-md)' }}>
                            <Flex justify="space-between" align="flex-start">
                                <Flex gap={12} align="flex-start" style={{ flex: 1, minWidth: 0 }}>
                                    <FileProtectOutlined style={{ fontSize: 18, color: 'var(--color-accent)', marginTop: 3 }} />
                                    <Space orientation="vertical" size={2} style={{ flex: 1, minWidth: 0 }}>
                                        <Text strong style={{ fontSize: 14 }}>{st.title}</Text>
                                        <Text type="secondary" ellipsis style={{ maxWidth: 600, fontSize: 12 }}>
                                            {st.description || '(no description)'}
                                        </Text>
                                    </Space>
                                </Flex>
                                <Popconfirm title="Delete this test?" onConfirm={() => deleteSpecTest.mutate({ id: st.id })}>
                                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            )}

            <Drawer title="New Spec Test" open={isModalOpen} onClose={() => setIsModalOpen(false)} size="large" extra={<Button type="primary" onClick={() => form.submit()} loading={createSpecTest.isPending}>Submit</Button>}>
                <Form form={form} layout="vertical" onFinish={(v) => projectId && createSpecTest.mutateAsync({ ...v, projectId })}>
                    <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                        <Input placeholder="Spec test title" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <TextArea placeholder="Description..." rows={6} />
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    )
}
