import React, { useState, useEffect } from 'react'
import { ConfigProvider, Layout, Menu, Dropdown, Button, Typography, theme as antTheme, Select, Space, Spin } from 'antd'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
    CodeOutlined,
    BookOutlined,
    ExperimentOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SunOutlined,
    MoonOutlined,
    DesktopOutlined,
    SwapOutlined,
    FolderOutlined,
    FileProtectOutlined,
    DashboardOutlined,
    UserOutlined,
    LogoutOutlined,
    ImportOutlined,
    SettingOutlined,
    TeamOutlined,
} from '@ant-design/icons'
import { useTheme, type ThemeMode } from './hooks/useTheme'
import { useWorkspace } from './hooks/useWorkspace'
import { WelcomePage } from './containers/WelcomePage'
import { DashboardPage } from './containers/DashboardPage'
import { CodePage } from './containers/CodePage'
import { StoryPage } from './containers/StoryPage'
import { UnitTestsPage } from './containers/TestsPage'
import { SpecTestsPage } from './containers/SpecTestsPage'
import { LoginPage } from './containers/LoginPage'
import { StatusBar } from './components/StatusBar'
import { TeamSettingsPage } from './containers/TeamSettingsPage'
import './styles/global.css'

const { Sider, Content, Header } = Layout
const { Text } = Typography

const themeOptions: { key: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { key: 'system', label: 'System', icon: <DesktopOutlined /> },
    { key: 'light', label: 'Light', icon: <SunOutlined /> },
    { key: 'dark', label: 'Dark', icon: <MoonOutlined /> },
]

interface AppLayoutProps {
    currentWorkspace: string
    openWorkspace: (path?: string) => Promise<string | null>
    session: { userId: string; userName: string; email: string }
    onLogout: () => void
    onCloseProject: () => void
    currentTeam: { id: string; name: string; slug: string } | null
    teams: { id: string; name: string; slug: string }[]
    onSwitchTeam: (teamId: string) => void
}

function AppLayout({ currentWorkspace, openWorkspace, session, onLogout, onCloseProject, currentTeam, teams, onSwitchTeam }: AppLayoutProps) {
    const [collapsed, setCollapsed] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const { mode, setMode } = useTheme()

    const folderName = currentWorkspace.split('/').pop() || currentWorkspace

    const menuItems = [
        {
            key: '/',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/story',
            icon: <BookOutlined />,
            label: 'Stories',
        },
        {
            key: '/code',
            icon: <CodeOutlined />,
            label: 'Codes',
        },
        {
            key: '/unit-tests',
            icon: <ExperimentOutlined />,
            label: 'Unit Tests',
        },
        {
            key: '/spec-tests',
            icon: <FileProtectOutlined />,
            label: 'Spec Tests',
        },
        { type: 'divider' as const },
        {
            key: '/settings',
            icon: <SettingOutlined />,
            label: 'Team Settings',
        },
    ]

    const themeMenuItems = themeOptions.map((opt) => ({
        key: opt.key,
        icon: opt.icon,
        label: opt.label,
    }))

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                trigger={null}
                width={220}
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 100,
                    paddingTop: 44,
                }}
            >
                <div
                    style={{
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: collapsed ? 0 : '0 24px',
                        fontWeight: 700,
                        fontSize: collapsed ? 16 : 18,
                        letterSpacing: 1,
                        userSelect: 'none',
                    }}
                >
                    {collapsed ? 'O' : 'Ockham'}
                </div>
                {!collapsed && currentTeam && teams.length > 0 && (
                    <div style={{ padding: '0 12px 8px' }}>
                        <Select
                            size="small"
                            value={currentTeam.id}
                            onChange={onSwitchTeam}
                            style={{ width: '100%' }}
                            options={teams.map((t) => ({
                                value: t.id,
                                label: (
                                    <Space size={4}>
                                        <TeamOutlined />
                                        <span>{t.name}</span>
                                    </Space>
                                ),
                            }))}
                        />
                    </div>
                )}
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                    style={{ borderRight: 0 }}
                />
            </Sider>
            <Layout
                style={{
                    marginLeft: collapsed ? 80 : 220,
                    transition: 'margin-left 0.2s',
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                <Header
                    style={{
                        padding: '0 16px',
                        display: 'flex',
                        alignItems: 'center',
                        height: 44,
                        lineHeight: '44px',
                        flexShrink: 0,
                        // @ts-expect-error WebkitAppRegion is an Electron-specific CSS property
                        WebkitAppRegion: 'drag',
                    }}
                >
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        // @ts-expect-error WebkitAppRegion is an Electron-specific CSS property
                        style={{ WebkitAppRegion: 'no-drag' }}
                    />
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginLeft: 12,
                            // @ts-expect-error WebkitAppRegion is an Electron-specific CSS property
                            WebkitAppRegion: 'no-drag',
                        }}
                    >
                        <FolderOutlined style={{ fontSize: 14, opacity: 0.6 }} />
                        <Text
                            style={{ fontSize: 13, maxWidth: 300 }}
                            ellipsis={{ tooltip: currentWorkspace }}
                        >
                            {folderName}
                        </Text>
                        <Button
                            type="text"
                            size="small"
                            icon={<SwapOutlined />}
                            onClick={() => openWorkspace()}
                        />
                    </div>
                    <div style={{ flex: 1 }} />
                    <Dropdown
                        menu={{
                            items: themeMenuItems,
                            selectedKeys: [mode],
                            onClick: ({ key }) => setMode(key as ThemeMode),
                        }}
                        trigger={['click']}
                    >
                        <Button
                            type="text"
                            icon={mode === 'dark' ? <MoonOutlined /> : mode === 'light' ? <SunOutlined /> : <DesktopOutlined />}
                            // @ts-expect-error WebkitAppRegion is an Electron-specific CSS property
                            style={{ WebkitAppRegion: 'no-drag' }}
                        />
                    </Dropdown>
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'user-info',
                                    label: session.email,
                                    disabled: true,
                                    style: { fontSize: 12, opacity: 0.6 },
                                },
                                { type: 'divider' },
                                {
                                    key: 'close-project',
                                    icon: <ImportOutlined />,
                                    label: 'Close Project',
                                    onClick: onCloseProject,
                                },
                                {
                                    key: 'logout',
                                    icon: <LogoutOutlined />,
                                    label: 'Logout',
                                    danger: true,
                                    onClick: onLogout,
                                },
                            ],
                        }}
                        trigger={['click']}
                    >
                        <Button
                            type="text"
                            icon={<UserOutlined />}
                            // @ts-expect-error WebkitAppRegion is an Electron-specific CSS property
                            style={{ WebkitAppRegion: 'no-drag' }}
                        >
                            {session.userName || session.email.split('@')[0]}
                        </Button>
                    </Dropdown>
                </Header>
                <Content style={{ flex: 1, overflow: 'auto' }}>
                    <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/code" element={<CodePage />} />
                        <Route path="/story" element={<StoryPage />} />
                        <Route path="/unit-tests" element={<UnitTestsPage />} />
                        <Route path="/spec-tests" element={<SpecTestsPage />} />
                        <Route path="/settings" element={
                            currentTeam
                                ? <TeamSettingsPage currentTeam={currentTeam} />
                                : <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spin /></div>
                        } />
                    </Routes>
                </Content>
                <StatusBar />
            </Layout>
        </Layout>
    )
}

export default function App() {
    const { resolvedTheme } = useTheme()
    const { currentWorkspace, recentWorkspaces, loading, openWorkspace, closeWorkspace, removeRecent } = useWorkspace()
    const [session, setSession] = useState<{ userId: string; userName: string; email: string } | null>(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [teams, setTeams] = useState<{ id: string; name: string; slug: string }[]>([])
    const [currentTeam, setCurrentTeam] = useState<{ id: string; name: string; slug: string } | null>(null)

    useEffect(() => {
        async function init() {
            // 1. Restore session from localStorage immediately (fast UI)
            const cached = localStorage.getItem('ockham_session')
            const cachedToken = localStorage.getItem('ockham_auth_token')
            if (cached) {
                try {
                    const parsed = JSON.parse(cached)
                    setSession(parsed)
                } catch { /* ignore */ }
            }

            // Restore teams from cache immediately
            const cachedTeam = localStorage.getItem('ockham_current_team')
            const cachedTeams = localStorage.getItem('ockham_teams')
            if (cachedTeam) {
                try { setCurrentTeam(JSON.parse(cachedTeam)) } catch { /* ignore */ }
            }
            if (cachedTeams) {
                try { setTeams(JSON.parse(cachedTeams)) } catch { /* ignore */ }
            }

            // 2. Sync token from localStorage to main process (regardless of getSession result)
            if (cachedToken && cached) {
                try {
                    const parsedSession = JSON.parse(cached)
                    await window.authApi.syncSession({
                        token: cachedToken,
                        userId: parsedSession.userId,
                        userName: parsedSession.userName,
                        email: parsedSession.email,
                    })
                } catch { /* ignore */ }
            }

            // 3. Try to verify session with server via main process
            try {
                const s = await window.authApi.getSession()
                if (s) {
                    const sess = { userId: s.userId, userName: s.userName, email: s.email }
                    setSession(sess)
                    localStorage.setItem('ockham_session', JSON.stringify(sess))
                    if (s.token) {
                        localStorage.setItem('ockham_auth_token', s.token)
                    }
                } else if (!cached) {
                    setSession(null)
                }
            } catch { /* ignore */ }
            setAuthLoading(false)

            // 4. Load teams (main process now has token from step 2)
            try {
                const team = await window.teamApi.ensure()
                setCurrentTeam(team)
                localStorage.setItem('ockham_current_team', JSON.stringify(team))
                const list = await window.teamApi.list()
                setTeams(list)
                localStorage.setItem('ockham_teams', JSON.stringify(list))
            } catch { /* ignore */ }
        }
        init()
    }, [])

    if (loading || authLoading) {
        return null
    }

    const antdTheme = {
        algorithm:
            resolvedTheme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
            borderRadius: 8,
            colorPrimary: '#1677ff',
        },
        cssVar: { prefix: 'ockham' },
    }

    return (
        <ConfigProvider theme={antdTheme}>
            <HashRouter>
                {!session ? (
                    <LoginPage onLoginSuccess={async (s) => {
                        setSession(s)
                        localStorage.setItem('ockham_session', JSON.stringify(s))
                        // Save and sync token to main process
                        const token = ('token' in s) ? (s as { token?: string }).token : undefined
                        if (token) {
                            localStorage.setItem('ockham_auth_token', token)
                            await window.authApi.syncSession(s as { token: string; userId: string; userName: string; email: string }).catch(() => { })
                        }
                        // Load teams after login
                        try {
                            const team = await window.teamApi.ensure()
                            setCurrentTeam(team)
                            localStorage.setItem('ockham_current_team', JSON.stringify(team))
                            const list = await window.teamApi.list()
                            setTeams(list)
                            localStorage.setItem('ockham_teams', JSON.stringify(list))
                        } catch { /* non-blocking */ }
                    }} />
                ) : !currentWorkspace ? (
                    <WelcomePage
                        recentWorkspaces={recentWorkspaces}
                        openWorkspace={openWorkspace}
                        removeRecent={removeRecent}
                    />
                ) : (
                    <AppLayout
                        currentWorkspace={currentWorkspace}
                        openWorkspace={openWorkspace}
                        session={session}
                        onLogout={async () => {
                            await window.authApi.logout()
                            localStorage.removeItem('ockham_session')
                            localStorage.removeItem('ockham_auth_token')
                            localStorage.removeItem('ockham_current_team')
                            localStorage.removeItem('ockham_teams')
                            setSession(null)
                            setCurrentTeam(null)
                            setTeams([])
                        }}
                        onCloseProject={closeWorkspace}
                        currentTeam={currentTeam}
                        teams={teams}
                        onSwitchTeam={(teamId) => {
                            const t = teams.find((team) => team.id === teamId)
                            if (t) setCurrentTeam(t)
                        }}
                    />
                )}
            </HashRouter>
        </ConfigProvider>
    )
}
