'use client'

import { useState } from 'react'
import { Button, Card, Col, Form, Input, Modal, Row, Tabs, Typography, Space, Spin, Tag, message, Popconfirm, Empty } from 'antd'
import { PlusOutlined, TeamOutlined, ProjectOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { trpc } from '@/lib/trpc-client'
import { useWorkspace } from '@/lib/workspace-context'

const { Text } = Typography

export default function SettingsPage() {
    const [teamModal, setTeamModal] = useState(false)
    const [projectModal, setProjectModal] = useState(false)
    const [teamForm] = Form.useForm()
    const [projectForm] = Form.useForm()
    const utils = trpc.useUtils()
    const { teamId, teams } = useWorkspace()

    const { data: projects, isLoading: projectsLoading } = trpc.project.list.useQuery(
        { teamId: teamId! },
        { enabled: !!teamId }
    )

    const createTeam = trpc.team.create.useMutation({
        onSuccess: () => { utils.team.list.invalidate(); setTeamModal(false); teamForm.resetFields(); message.success('Team created') },
    })
    const deleteTeam = trpc.team.delete.useMutation({
        onSuccess: () => { utils.team.list.invalidate(); message.success('Team deleted') },
    })
    const createProject = trpc.project.create.useMutation({
        onSuccess: () => { if (teamId) utils.project.list.invalidate({ teamId }); setProjectModal(false); projectForm.resetFields(); message.success('Project created') },
    })
    const deleteProject = trpc.project.delete.useMutation({
        onSuccess: () => { if (teamId) utils.project.list.invalidate({ teamId }); message.success('Project deleted') },
    })

    const handleSlug = (form: ReturnType<typeof Form.useForm>[0]) => {
        const name = form.getFieldValue('name')
        if (name) form.setFieldValue('slug', name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    }

    const teamsContent = (
        <>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setTeamModal(true)}>New Team</Button>
            </div>
            {!teams.length ? <Empty description="No teams yet" /> : (
                <Row gutter={[16, 16]}>
                    {teams.map((team) => (
                        <Col key={team.id} xs={24} sm={12} lg={8}>
                            <Card
                                hoverable
                                actions={[
                                    <EditOutlined key="edit" />,
                                    <Popconfirm key="del" title="Delete this team?" onConfirm={() => deleteTeam.mutate({ id: team.id })}>
                                        <DeleteOutlined />
                                    </Popconfirm>,
                                ]}
                            >
                                <Card.Meta
                                    avatar={<TeamOutlined style={{ fontSize: 22, color: 'var(--color-primary)' }} />}
                                    title={team.name}
                                    description={<Tag>{team.slug}</Tag>}
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
            <Modal title="New Team" open={teamModal} onCancel={() => setTeamModal(false)} onOk={() => teamForm.submit()} confirmLoading={createTeam.isPending}>
                <Form form={teamForm} layout="vertical" onFinish={(v) => createTeam.mutateAsync(v)}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input placeholder="My Team" onBlur={() => handleSlug(teamForm)} />
                    </Form.Item>
                    <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
                        <Input placeholder="my-team" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )

    const projectsContent = (
        <>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setProjectModal(true)} disabled={!teamId}>New Project</Button>
            </div>
            {!teamId ? <Empty description="Please select a team first" /> : projectsLoading ? (
                <Spin style={{ display: 'block', textAlign: 'center', padding: 48 }} />
            ) : !projects?.length ? <Empty description="No projects yet" /> : (
                <Row gutter={[16, 16]}>
                    {projects.map((project) => (
                        <Col key={project.id} xs={24} sm={12} lg={8}>
                            <Card
                                hoverable
                                actions={[
                                    <EditOutlined key="edit" />,
                                    <Popconfirm key="del" title="Delete this project?" onConfirm={() => deleteProject.mutate({ id: project.id })}>
                                        <DeleteOutlined />
                                    </Popconfirm>,
                                ]}
                            >
                                <Card.Meta
                                    avatar={<ProjectOutlined style={{ fontSize: 22, color: '#722ed1' }} />}
                                    title={project.name}
                                    description={
                                        <Space orientation="vertical" size={2}>
                                            <Tag color="purple">{project.slug}</Tag>
                                            {project.description && <Text type="secondary" style={{ fontSize: 12 }}>{project.description}</Text>}
                                        </Space>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
            <Modal title="New Project" open={projectModal} onCancel={() => setProjectModal(false)} onOk={() => projectForm.submit()} confirmLoading={createProject.isPending}>
                <Form form={projectForm} layout="vertical" onFinish={(v) => createProject.mutateAsync({ ...v, teamId })} initialValues={{ teamId }}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input placeholder="My Project" onBlur={() => handleSlug(projectForm)} />
                    </Form.Item>
                    <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
                        <Input placeholder="my-project" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )

    return (
        <div>
            <div className="page-header">
                <div className="page-title">Settings</div>
            </div>
            <Tabs items={[
                { key: 'teams', label: <span><TeamOutlined /> Teams</span>, children: teamsContent },
                { key: 'projects', label: <span><ProjectOutlined /> Projects</span>, children: projectsContent },
            ]} />
        </div>
    )
}
