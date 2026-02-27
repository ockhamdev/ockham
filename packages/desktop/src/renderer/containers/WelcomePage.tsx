import React from 'react'
import { Button, List, Typography } from 'antd'
import {
    FolderOpenOutlined,
    DeleteOutlined,
    FolderOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

interface WelcomePageProps {
    recentWorkspaces: string[]
    openWorkspace: (path?: string) => Promise<string | null>
    removeRecent: (path: string) => Promise<void>
}

export function WelcomePage({ recentWorkspaces, openWorkspace, removeRecent }: WelcomePageProps) {
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
                                    onClick={() => openWorkspace(ws)}
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
