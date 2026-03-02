'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
    ConfigProvider, Layout, Menu, Button, Typography, Dropdown, Avatar,
    Popover, Space, Divider, theme as antTheme,
} from 'antd'
import {
    DashboardOutlined,
    ReadOutlined,
    BookOutlined,
    ExperimentOutlined,
    FileProtectOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SettingOutlined,
    SunOutlined,
    MoonOutlined,
    LogoutOutlined,
    UserOutlined,
    SwapOutlined,
    CheckOutlined,
} from '@ant-design/icons'
import { useSession, signOut } from '@/lib/auth-client'
import { WorkspaceProvider, useWorkspace } from '@/lib/workspace-context'

const { Sider, Content, Header } = Layout
const { Text } = Typography

type ThemeMode = 'light' | 'dark'

function WorkspaceSelector({ collapsed }: { collapsed: boolean }) {
    const { teams, projects, teamId, projectId, setTeamId, setProjectId } = useWorkspace()
    const currentTeam = teams.find((t) => t.id === teamId)
    const currentProject = projects.find((p) => p.id === projectId)

    const content = (
        <div style={{ width: 220 }}>
            <div className="workspace-label" style={{ padding: '4px 0', marginBottom: 4 }}>TEAM</div>
            {teams.map((t) => (
                <div
                    key={t.id}
                    onClick={() => setTeamId(t.id)}
                    style={{
                        padding: '6px 8px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: t.id === teamId ? 'var(--color-primary-soft)' : 'transparent',
                    }}
                >
                    <Text style={{ fontSize: 13 }}>{t.name}</Text>
                    {t.id === teamId && <CheckOutlined style={{ fontSize: 11, color: 'var(--color-primary)' }} />}
                </div>
            ))}
            {projects.length > 0 && (
                <>
                    <Divider style={{ margin: '8px 0' }} />
                    <div className="workspace-label" style={{ padding: '4px 0', marginBottom: 4 }}>PROJECT</div>
                    {projects.map((p) => (
                        <div
                            key={p.id}
                            onClick={() => setProjectId(p.id)}
                            style={{
                                padding: '6px 8px',
                                borderRadius: 6,
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: p.id === projectId ? 'var(--color-primary-soft)' : 'transparent',
                            }}
                        >
                            <Text style={{ fontSize: 13 }}>{p.name}</Text>
                            {p.id === projectId && <CheckOutlined style={{ fontSize: 11, color: 'var(--color-primary)' }} />}
                        </div>
                    ))}
                </>
            )}
        </div>
    )

    if (collapsed) {
        return (
            <Popover content={content} trigger="click" placement="rightTop">
                <div style={{ padding: '12px 0', textAlign: 'center', cursor: 'pointer' }}>
                    <SwapOutlined style={{ color: 'var(--sidebar-text)', fontSize: 16 }} />
                </div>
            </Popover>
        )
    }

    return (
        <Popover content={content} trigger="click" placement="rightTop">
            <div className="workspace-selector">
                <div className="workspace-label">WORKSPACE</div>
                <div className="workspace-team">{currentTeam?.name || 'Select Team'}</div>
                {currentProject && (
                    <div className="workspace-project">{currentProject.name}</div>
                )}
            </div>
        </Popover>
    )
}

function DashboardShell({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false)
    const [themeMode, setThemeMode] = useState<ThemeMode>('light')
    const router = useRouter()
    const pathname = usePathname()
    const { data: session, isPending } = useSession()

    // Sync theme to DOM so CSS variables respond
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', themeMode)
    }, [themeMode])

    if (isPending) return null
    if (!session?.user) {
        router.push('/login')
        return null
    }

    const menuItems = [
        { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: '/dashboard/stories', icon: <BookOutlined />, label: 'Stories' },
        { key: '/dashboard/tests', icon: <ExperimentOutlined />, label: 'Unit Tests' },
        { key: '/dashboard/spec-tests', icon: <FileProtectOutlined />, label: 'Spec Tests' },
        { key: '/dashboard/knowledge', icon: <ReadOutlined />, label: 'Knowledge' },
    ]

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: session.user.name || session.user.email,
            disabled: true,
        },
        { type: 'divider' as const },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Settings',
            onClick: () => router.push('/dashboard/settings'),
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Sign Out',
            danger: true,
            onClick: handleLogout,
        },
    ]

    const antdTheme = {
        algorithm: themeMode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
            borderRadius: 8,
            colorPrimary: '#0ea5e9',
            fontFamily: 'var(--font-body)',
        },
        cssVar: { prefix: 'ockham' },
    }

    const siderWidth = collapsed ? 64 : 240

    return (
        <ConfigProvider theme={antdTheme}>
            <Layout style={{ minHeight: '100vh' }}>
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    trigger={null}
                    width={240}
                    collapsedWidth={64}
                    style={{
                        position: 'fixed',
                        left: 0, top: 0, bottom: 0,
                        zIndex: 100,
                        overflow: 'auto',
                        background: 'var(--sidebar-bg)',
                        borderRight: '1px solid rgba(255,255,255,0.04)',
                    }}
                >
                    {/* Logo */}
                    <div
                        style={{
                            height: 52,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            padding: collapsed ? 0 : '0 20px',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: collapsed ? 18 : 20,
                            letterSpacing: -1,
                            color: 'var(--sidebar-text-active)',
                            userSelect: 'none',
                        }}
                    >
                        {collapsed ? 'O' : 'Ockham'}
                    </div>

                    {/* Workspace Selector */}
                    <WorkspaceSelector collapsed={collapsed} />

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 14px 8px' }} />

                    {/* Navigation */}
                    <Menu
                        mode="inline"
                        selectedKeys={[pathname]}
                        items={menuItems}
                        onClick={({ key }) => router.push(key)}
                        style={{
                            background: 'transparent',
                            border: 0,
                            fontFamily: 'var(--font-body)',
                            fontSize: 13,
                        }}
                        theme="dark"
                    />


                </Sider>

                <Layout
                    style={{
                        marginLeft: siderWidth,
                        transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        minHeight: '100vh',
                        background: 'var(--color-bg)',
                    }}
                >
                    <Header
                        style={{
                            padding: '0 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            height: 52,
                            lineHeight: '52px',
                            background: 'var(--color-surface)',
                            borderBottom: '1px solid var(--color-border-subtle)',
                        }}
                    >
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ color: 'var(--color-text-secondary)' }}
                        />
                        <Space size={4}>
                            <Button
                                type="text"
                                icon={themeMode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                                onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                                style={{ color: 'var(--color-text-secondary)' }}
                            />
                            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                                <Space style={{ cursor: 'pointer' }}>
                                    <Avatar size={28} style={{ background: 'var(--color-primary)', fontSize: 12 }}>
                                        {(session.user.name?.[0] || session.user.email?.[0] || 'U').toUpperCase()}
                                    </Avatar>
                                    <Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                                        {session.user.name}
                                    </Text>
                                </Space>
                            </Dropdown>
                        </Space>
                    </Header>
                    <Content style={{ padding: 24, overflow: 'auto' }}>
                        {children}
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <WorkspaceProvider>
            <DashboardShell>{children}</DashboardShell>
        </WorkspaceProvider>
    )
}
