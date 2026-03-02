import React, { useState, useEffect, useCallback } from 'react'
import { Typography, Button, Tag, Space, Tooltip } from 'antd'
import { BranchesOutlined, ReloadOutlined, FileOutlined } from '@ant-design/icons'

const { Text } = Typography

interface GitStatus {
    branch: string
    commit: string
    commitShort: string
    changedFiles: number
    dirty: boolean
    version: string
}

const REFRESH_INTERVAL = 30_000 // 30s

export function StatusBar() {
    const [gitStatus, setGitStatus] = useState<GitStatus | null>(null)
    const [loading, setLoading] = useState(false)

    const refresh = useCallback(async () => {
        setLoading(true)
        try {
            const status = await window.gitApi.getStatus()
            setGitStatus(status)
        } catch {
            setGitStatus(null)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refresh()
        const timer = setInterval(refresh, REFRESH_INTERVAL)
        return () => clearInterval(timer)
    }, [refresh])

    return (
        <div
            style={{
                height: 28,
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                borderTop: '1px solid rgba(128,128,128,0.15)',
                fontSize: 12,
                flexShrink: 0,
                gap: 12,
            }}
        >
            {gitStatus ? (
                <>
                    <Space size={4}>
                        <BranchesOutlined style={{ fontSize: 12, opacity: 0.6 }} />
                        <Text style={{ fontSize: 12 }}>{gitStatus.branch}</Text>
                    </Space>

                    <Tooltip title={gitStatus.commit}>
                        <Tag
                            color={gitStatus.dirty ? 'orange' : 'green'}
                            style={{ fontSize: 11, lineHeight: '18px', margin: 0 }}
                        >
                            {gitStatus.version}
                        </Tag>
                    </Tooltip>

                    {gitStatus.changedFiles > 0 && (
                        <Space size={4}>
                            <FileOutlined style={{ fontSize: 11, opacity: 0.6 }} />
                            <Text type="warning" style={{ fontSize: 12 }}>
                                {gitStatus.changedFiles} changed
                            </Text>
                        </Space>
                    )}
                </>
            ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>No git info</Text>
            )}

            <Button
                type="text"
                size="small"
                icon={<ReloadOutlined spin={loading} />}
                onClick={refresh}
                style={{ fontSize: 12, height: 20, width: 20, padding: 0 }}
            />
        </div>
    )
}
