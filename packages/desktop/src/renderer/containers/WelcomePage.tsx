import React, { useCallback, useEffect, useState } from 'react'
import { Button, List, Typography, Select, Space, Empty, Spin, Tag, Modal, message } from 'antd'
import {
    FolderOpenOutlined,
    TeamOutlined,
    AppstoreOutlined,
    LinkOutlined,
} from '@ant-design/icons'
import { listProjects, type Project } from '../api'

const { Title, Text, Paragraph } = Typography

interface Team {
    id: string
    name: string
    slug: string
}

interface WelcomePageProps {
    openWorkspace: (path?: string) => Promise<string | null>
}

/** localStorage key for saved project → local directory mapping */
const projectPathKey = (projectId: string) => `ockham:project-path:${projectId}`

/**
 * Normalize a git remote URL for comparison.
 * Strips protocol, trailing .git, user@ prefix, and port.
 * e.g. "git@github.com:org/repo.git" → "github.com/org/repo"
 *      "https://github.com/org/repo"  → "github.com/org/repo"
 */
function normalizeGitRemote(url: string): string {
    let u = url.trim()
    // SSH: git@host:org/repo.git → host/org/repo
    const sshMatch = u.match(/^[\w-]+@([\w.-]+):(.*?)(?:\.git)?$/)
    if (sshMatch) return `${sshMatch[1]}/${sshMatch[2]}`
    // HTTPS
    u = u.replace(/^https?:\/\//, '').replace(/\.git$/, '')
    return u
}

export function WelcomePage({ openWorkspace }: WelcomePageProps) {
    const [teams, setTeams] = useState<Team[]>([])
    const [currentTeamId, setCurrentTeamId] = useState<string | null>(null)
    const [loadingTeams, setLoadingTeams] = useState(true)
    const [projects, setProjects] = useState<Project[]>([])
    const [loadingProjects, setLoadingProjects] = useState(false)

    // Load teams on mount
    useEffect(() => {
        (async () => {
            try {
                const team = await window.teamApi.ensure()
                setCurrentTeamId(team.id)
                const teamList = await window.teamApi.list()
                setTeams(teamList)
            } catch {
                // ignore — user may not be logged in yet
            }
            setLoadingTeams(false)
        })()
    }, [])

    // Load projects when team changes
    useEffect(() => {
        if (!currentTeamId) {
            setProjects([])
            return
        }
        setLoadingProjects(true)
        listProjects(currentTeamId)
            .then(setProjects)
            .catch(() => setProjects([]))
            .finally(() => setLoadingProjects(false))
    }, [currentTeamId])


    /**
     * Open a cloud project: check saved local path or prompt directory picker,
     * then validate git remote origin matches the project slug.
     */
    const handleOpenProject = useCallback(async (project: Project) => {
        const savedPath = localStorage.getItem(projectPathKey(project.id))

        if (savedPath) {
            // Verify the saved path still has the correct git remote
            try {
                const remote = await window.gitApi.getRemoteOrigin(savedPath)
                if (remote && normalizeGitRemote(remote) === normalizeGitRemote(project.slug)) {
                    await openWorkspace(savedPath)
                    return
                }
            } catch {
                // Saved path is stale, fall through to picker
            }
            // Clear stale mapping
            localStorage.removeItem(projectPathKey(project.id))
        }

        // No saved path — ask user to select directory
        const selectedDir = await openWorkspace()
        if (!selectedDir) return // user cancelled

        // Validate git remote
        try {
            const remote = await window.gitApi.getRemoteOrigin(selectedDir)
            if (!remote) {
                Modal.error({
                    title: 'Not a Git Repository',
                    content: `The selected directory does not have a git remote origin.\n\nPlease select the local clone of this project.`,
                })
                return
            }

            const normalizedRemote = normalizeGitRemote(remote)
            const normalizedSlug = normalizeGitRemote(project.slug)

            if (normalizedRemote !== normalizedSlug) {
                Modal.error({
                    title: 'Git Remote Mismatch',
                    content: (
                        <div>
                            <p>The selected directory's git remote does not match this project.</p>
                            <p><strong>Expected:</strong> <code>{project.slug}</code></p>
                            <p><strong>Got:</strong> <code>{remote}</code></p>
                        </div>
                    ),
                })
                return
            }

            // Match! Save mapping
            localStorage.setItem(projectPathKey(project.id), selectedDir)
            message.success(`Opened project: ${project.name}`)
        } catch {
            Modal.error({
                title: 'Error',
                content: 'Failed to verify git remote origin for the selected directory.',
            })
        }
    }, [openWorkspace])

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: 48,
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <Title level={1} style={{ marginBottom: 8 }}>
                    Welcome to Ockham
                </Title>
                <Paragraph type="secondary" style={{ fontSize: 16 }}>
                    Test-driven delivery, powered by AI collaboration
                </Paragraph>

                {/* Team selector */}
                {!loadingTeams && teams.length > 0 && (
                    <div style={{ marginTop: 16, marginBottom: 24 }}>
                        <Space align="center">
                            <TeamOutlined style={{ fontSize: 16, opacity: 0.6 }} />
                            <Text type="secondary" style={{ fontSize: 13 }}>Team:</Text>
                            <Select
                                value={currentTeamId}
                                onChange={(val) => setCurrentTeamId(val)}
                                style={{ minWidth: 200 }}
                                options={teams.map((t) => ({
                                    value: t.id,
                                    label: t.name,
                                }))}
                            />
                        </Space>
                    </div>
                )}

                <Button
                    type="primary"
                    size="large"
                    icon={<FolderOpenOutlined />}
                    onClick={() => openWorkspace()}
                    style={{ marginTop: 16 }}
                >
                    Open Workspace
                </Button>
            </div>

            {/* Projects in current team */}
            {currentTeamId && (
                <div style={{ width: '100%', maxWidth: 600, marginBottom: 32 }}>
                    <Title level={4} style={{ marginBottom: 16 }}>
                        <AppstoreOutlined style={{ marginRight: 8 }} />
                        Projects
                        {teams.length > 0 && (
                            <Text type="secondary" style={{ fontSize: 14, fontWeight: 400, marginLeft: 8 }}>
                                in {teams.find(t => t.id === currentTeamId)?.name}
                            </Text>
                        )}
                    </Title>
                    {loadingProjects ? (
                        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
                    ) : projects.length === 0 ? (
                        <Empty
                            description="No projects yet"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            style={{ padding: 24 }}
                        />
                    ) : (
                        <List
                            dataSource={projects}
                            renderItem={(project) => {
                                const savedPath = localStorage.getItem(projectPathKey(project.id))
                                return (
                                    <List.Item
                                        style={{ padding: '12px 16px', cursor: 'pointer' }}
                                        onClick={() => handleOpenProject(project)}
                                        actions={[
                                            <Button
                                                key="open"
                                                type="link"
                                                size="small"
                                                icon={<FolderOpenOutlined />}
                                                onClick={(e) => { e.stopPropagation(); handleOpenProject(project) }}
                                            >
                                                Open
                                            </Button>,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <AppstoreOutlined
                                                    style={{ fontSize: 20, color: 'var(--ant-primary-color)', marginTop: 4 }}
                                                />
                                            }
                                            title={<Text strong>{project.name}</Text>}
                                            description={
                                                <div>
                                                    <div>
                                                        <LinkOutlined style={{ fontSize: 11, marginRight: 4, opacity: 0.5 }} />
                                                        <Text type="secondary" style={{ fontSize: 12 }}>{project.slug}</Text>
                                                    </div>
                                                    {savedPath && (
                                                        <div style={{ marginTop: 2 }}>
                                                            <FolderOpenOutlined style={{ fontSize: 11, marginRight: 4, opacity: 0.5 }} />
                                                            <Text style={{ fontSize: 12, color: '#52c41a' }}>{savedPath}</Text>
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )
                            }}
                        />
                    )}
                </div>
            )}

        </div>
    )
}
