import React, { useCallback, useEffect, useState } from 'react'
import { Button, List, Typography, Select, Space, message } from 'antd'
import {
    FolderOpenOutlined,
    DeleteOutlined,
    FolderOutlined,
    TeamOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

interface Team {
    id: string
    name: string
    slug: string
}

interface WelcomePageProps {
    recentWorkspaces: string[]
    openWorkspace: (path?: string) => Promise<string | null>
    removeRecent: (path: string) => Promise<void>
}

export function WelcomePage({ recentWorkspaces, openWorkspace, removeRecent }: WelcomePageProps) {
    const [teams, setTeams] = useState<Team[]>([])
    const [currentTeamId, setCurrentTeamId] = useState<string | null>(null)
    const [loadingTeams, setLoadingTeams] = useState(true)

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

    /**
     * Open a workspace, then ensure the project exists in the DB for the selected team.
     */
    const handleOpenWorkspace = useCallback(async (path?: string) => {
        const result = await openWorkspace(path)
        if (!result || !currentTeamId) return result

        // Check git remote origin
        try {
            const remoteOrigin = await window.gitApi.getRemoteOrigin(result)
            if (remoteOrigin) {
                // Extract project name from remote URL
                const name = remoteOrigin
                    .replace(/\.git$/, '')
                    .split('/')
                    .pop() || result.split('/').pop() || 'Untitled'

                await window.projectApi.ensure(currentTeamId, remoteOrigin, name)
            }
        } catch {
            // Non-blocking — project linking is best-effort
        }

        return result
    }, [openWorkspace, currentTeamId])

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
                    onClick={() => handleOpenWorkspace()}
                    style={{ marginTop: 16 }}
                >
                    Open Workspace
                </Button>
            </div>

            {recentWorkspaces.length > 0 && (
                <div style={{ width: '100%', maxWidth: 600 }}>
                    <Title level={4} style={{ marginBottom: 16 }}>
                        Recent Projects
                    </Title>
                    <List
                        dataSource={recentWorkspaces}
                        renderItem={(ws) => {
                            const folderName = ws.split('/').pop() || ws
                            return (
                                <List.Item
                                    style={{
                                        cursor: 'pointer',
                                        padding: '12px 16px',
                                        borderRadius: 8,
                                        transition: 'background 0.2s',
                                    }}
                                    onClick={() => handleOpenWorkspace(ws)}
                                    actions={[
                                        <Button
                                            key="remove"
                                            type="text"
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeRecent(ws)
                                            }}
                                        />,
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <FolderOutlined
                                                style={{ fontSize: 24, color: 'var(--ant-primary-color)' }}
                                            />
                                        }
                                        title={<Text strong>{folderName}</Text>}
                                        description={<Text type="secondary">{ws}</Text>}
                                    />
                                </List.Item>
                            )
                        }}
                    />
                </div>
            )}
        </div>
    )
}
