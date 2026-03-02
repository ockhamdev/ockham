'use client'

import { useState } from 'react'
import { Button, Card, Col, Form, Input, Modal, Row, Typography, Space, Spin, Tag, message, Popconfirm } from 'antd'
import { PlusOutlined, TeamOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { trpc } from '@/lib/trpc-client'

const { Title, Text } = Typography

export default function TeamsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form] = Form.useForm()
    const utils = trpc.useUtils()

    const { data: teams, isLoading } = trpc.team.list.useQuery()
    const createTeam = trpc.team.create.useMutation({
        onSuccess: () => {
            utils.team.list.invalidate()
            setIsModalOpen(false)
            form.resetFields()
            message.success('Team created')
        },
    })
    const deleteTeam = trpc.team.delete.useMutation({
        onSuccess: () => {
            utils.team.list.invalidate()
            message.success('Team deleted')
        },
    })

    const handleCreate = async (values: { name: string; slug: string }) => {
        await createTeam.mutateAsync(values)
    }

    const handleSlugGenerate = () => {
        const name = form.getFieldValue('name')
        if (name) {
            form.setFieldValue('slug', name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Teams</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                    New Team
                </Button>
            </div>

            {isLoading ? (
                <Spin style={{ display: 'block', textAlign: 'center', padding: 48 }} />
            ) : (
                <Row gutter={[16, 16]}>
                    {teams?.map((team) => (
                        <Col key={team.id} xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
                            <Card
                                hoverable
                                actions={[
                                    <EditOutlined key="edit" />,
                                    <Popconfirm
                                        key="delete"
                                        title="Delete this team?"
                                        onConfirm={() => deleteTeam.mutate({ id: team.id })}
                                    >
                                        <DeleteOutlined />
                                    </Popconfirm>,
                                ]}
                            >
                                <Card.Meta
                                    avatar={<TeamOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
                                    title={team.name}
                                    description={
                                        <Space orientation="vertical" size={4}>
                                            <Tag color="blue">{team.slug}</Tag>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Created {new Date(team.createdAt).toLocaleDateString()}
                                            </Text>
                                        </Space>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <Modal
                title="New Team"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={createTeam.isPending}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate}>
                    <Form.Item name="name" label="Team Name" rules={[{ required: true, message: 'Please enter team name' }]}>
                        <Input placeholder="My Team" onBlur={handleSlugGenerate} />
                    </Form.Item>
                    <Form.Item name="slug" label="Team Slug" rules={[{ required: true, message: 'Please enter team slug' }]}>
                        <Input placeholder="my-team" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
