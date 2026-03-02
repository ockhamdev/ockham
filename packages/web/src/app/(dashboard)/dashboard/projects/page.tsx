'use client'

import { useState } from 'react'
import { Button, Card, Col, Form, Input, Modal, Row, Select, Typography, Space, Spin, Tag, message, Popconfirm, Empty } from 'antd'
import { PlusOutlined, ProjectOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { trpc } from '@/lib/trpc-client'

const { Title, Text } = Typography

export default function ProjectsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
    const [form] = Form.useForm()
    const utils = trpc.useUtils()

    const { data: teams } = trpc.team.list.useQuery()
    const { data: projects, isLoading } = trpc.project.list.useQuery(
        { teamId: selectedTeamId! },
        { enabled: !!selectedTeamId }
    )

    const createProject = trpc.project.create.useMutation({
        onSuccess: () => {
            if (selectedTeamId) utils.project.list.invalidate({ teamId: selectedTeamId })
            setIsModalOpen(false)
            form.resetFields()
            message.success('Project created')
        },
    })

    const deleteProject = trpc.project.delete.useMutation({
        onSuccess: () => {
            if (selectedTeamId) utils.project.list.invalidate({ teamId: selectedTeamId })
            message.success('Project deleted')
        },
    })

    const handleCreate = async (values: { teamId: string; name: string; slug: string; description: string }) => {
        await createProject.mutateAsync(values)
    }

    const handleSlugGenerate = () => {
        const name = form.getFieldValue('name')
        if (name) {
            form.setFieldValue('slug', name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
        }
    }

    // Auto-select first team
    if (teams?.length && !selectedTeamId) {
        setSelectedTeamId(teams[0].id)
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>Projects</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} disabled={!teams?.length}>
                    New Project
                </Button>
            </div>

            {teams && teams.length > 0 && (
                <Select
                    value={selectedTeamId}
                    onChange={setSelectedTeamId}
                    style={{ width: 240, marginBottom: 16 }}
                    options={teams.map((t) => ({ value: t.id, label: t.name }))}
                    placeholder="Select Team"
                />
            )}

            {!teams?.length ? (
                <Empty description="Please create a team first" />
            ) : isLoading ? (
                <Spin style={{ display: 'block', textAlign: 'center', padding: 48 }} />
            ) : !projects?.length ? (
                <Empty description="No projects yet" />
            ) : (
                <Row gutter={[16, 16]}>
                    {projects.map((project) => (
                        <Col key={project.id} xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
                            <Card
                                hoverable
                                actions={[
                                    <EditOutlined key="edit" />,
                                    <Popconfirm
                                        key="delete"
                                        title="Delete this project?"
                                        onConfirm={() => deleteProject.mutate({ id: project.id })}
                                    >
                                        <DeleteOutlined />
                                    </Popconfirm>,
                                ]}
                            >
                                <Card.Meta
                                    avatar={<ProjectOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
                                    title={project.name}
                                    description={
                                        <Space orientation="vertical" size={4}>
                                            <Tag color="purple">{project.slug}</Tag>
                                            {project.description && (
                                                <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                                                    {project.description}
                                                </Text>
                                            )}
                                        </Space>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <Modal
                title="New Project"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={createProject.isPending}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ teamId: selectedTeamId }}>
                    <Form.Item name="teamId" label="Team" rules={[{ required: true }]}>
                        <Select options={teams?.map((t) => ({ value: t.id, label: t.name })) ?? []} />
                    </Form.Item>
                    <Form.Item name="name" label="Project Name" rules={[{ required: true, message: 'Please enter project name' }]}>
                        <Input placeholder="My Project" onBlur={handleSlugGenerate} />
                    </Form.Item>
                    <Form.Item name="slug" label="Project Slug" rules={[{ required: true, message: 'Please enter project slug' }]}>
                        <Input placeholder="my-project" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea placeholder="Description..." rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
