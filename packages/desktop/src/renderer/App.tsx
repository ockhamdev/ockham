import React, { useState, useEffect } from 'react'
import { ConfigProvider, Layout, Menu, Dropdown, Button, Typography, theme as antTheme, Select, Space, Spin, App as AntdApp, Modal, Form, Input, Tabs } from 'antd'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
    CodeOutlined,
    BookOutlined,
    ReadOutlined,
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
    PlusOutlined,
    BugOutlined,
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
import { KnowledgeBasePage } from './containers/KnowledgeBasePage'
import { IssuesPage } from './containers/IssuesPage'
import { ProjectKnowledgePage } from './containers/ProjectKnowledgePage'
import { ProposalsPage } from './containers/ProposalsPage'
import { getStoredSession, getStoredToken, apiLogout, ensureTeam, listTeams, createTeam, ensureProject, type Project } from './api'
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
    currentProject: Project | null
    teams: { id: string; name: string; slug: string }[]
    onSwitchTeam: (teamId: string) => void
    onCreateTeam: (name: string) => Promise<void>
}

function AppLayout({ currentWorkspace, openWorkspace, session, onLogout, onCloseProject, currentTeam, currentProject, teams, onSwitchTeam, onCreateTeam }: AppLayoutProps) {
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
        { type: 'divider' as const },
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
            key: '/story',
            icon: <BookOutlined />,
            label: 'Stories',
        },
        {
            key: '/issues',
            icon: <BugOutlined />,
            label: 'Issues',
        },
        {
            key: '/project-knowledge',
            icon: <ReadOutlined />,
            label: 'Knowledge',
        },
        { type: 'divider' as const },
        {
            key: '/proposals',
            icon: <ImportOutlined />,
            label: 'Proposals',
        },
    ]

    const teamMenuItems = [
        {
            key: '__team_settings__',
            icon: <SettingOutlined />,
            label: 'Team Settings',
        },
    ]

    const handleTeamMenuClick = ({ key }: { key: string }) => {
        if (key === '__team_settings__') {
            const width = 960
            const height = 700
            const left = Math.round((window.screen.width - width) / 2)
            const top = Math.round((window.screen.height - height) / 2)
            window.open(
                `${window.location.pathname}${window.location.search}#/team-settings-window`,
                'team-settings',
                `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no`,
            )
        }
    }

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
                    overflow: 'hidden',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                            flexShrink: 0,
                        }}
                    >
                        {collapsed ? 'O' : 'Ockham'}
                    </div>
                    {!collapsed && currentTeam && teams.length > 0 && (
                        <div style={{ padding: '0 12px 8px', flexShrink: 0 }}>
                            <Select
                                size="small"
                                value={currentTeam.id}
                                onChange={(val) => {
                                    if (val === '__create__') {
                                        onCreateTeam('')
                                    } else {
                                        onSwitchTeam(val)
                                    }
                                }}
                                style={{ width: '100%' }}
                                options={[
                                    ...teams.map((t) => ({
                                        value: t.id,
                                        label: (
                                            <Space size={4}>
                                                <TeamOutlined />
                                                <span>{t.name}</span>
                                            </Space>
                                        ),
                                    })),
                                    {
                                        value: '__create__',
                                        label: (
                                            <Space size={4} style={{ color: '#1677ff' }}>
                                                <PlusOutlined />
                                                <span>Create Team</span>
                                            </Space>
                                        ),
                                    },
                                ]}
                            />
                        </div>
                    )}
                    <Menu
                        mode="inline"
                        selectedKeys={[location.pathname]}
                        items={menuItems}
                        onClick={({ key }) => navigate(key)}
                        style={{ borderRight: 0, flex: 'none' }}
                    />
                    <div style={{ flex: 1 }} />
                    <Menu
                        mode="inline"
                        selectedKeys={[]}
                        items={teamMenuItems}
                        onClick={handleTeamMenuClick}
                        style={{ borderRight: 0, flex: 'none' }}
                    />
                </div>
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
                        <Route path="/" element={
                            currentProject
                                ? <DashboardPage projectId={currentProject.id} />
                                : <DashboardPage />
                        } />
                        <Route path="/code" element={<CodePage />} />
                        <Route path="/story" element={
                            currentProject
                                ? <StoryPage projectId={currentProject.id} teamId={currentTeam?.id} />
                                : <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spin /></div>
                        } />
                        <Route path="/unit-tests" element={
                            currentProject
                                ? <UnitTestsPage projectId={currentProject.id} />
                                : <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spin /></div>
                        } />
                        <Route path="/spec-tests" element={
                            currentProject
                                ? <SpecTestsPage projectId={currentProject.id} />
                                : <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spin /></div>
                        } />
                        <Route path="/issues" element={
                            currentProject
                                ? <IssuesPage projectId={currentProject.id} />
                                : <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spin /></div>
                        } />
                        <Route path="/project-knowledge" element={
                            currentProject
                                ? <ProjectKnowledgePage projectId={currentProject.id} />
                                : <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spin /></div>
                        } />
                        <Route path="/proposals" element={
                            currentProject
                                ? <ProposalsPage projectId={currentProject.id} />
                                : <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spin /></div>
                        } />
                    </Routes>
                </Content>
                <StatusBar />
            </Layout>
        </Layout>
    )
}

// ── Standalone Team Settings Window ──

function TeamSettingsWindow() {
    const [team, setTeam] = useState<{ id: string; name: string; slug: string } | null>(null)

    useEffect(() => {
        const cached = localStorage.getItem('ockham_current_team')
        if (cached) {
            try { setTeam(JSON.parse(cached)) } catch { /* */ }
        }
    }, [])

    if (!team) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        )
    }

    return (
        <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
            <Tabs
                defaultActiveKey="settings"
                items={[
                    {
                        key: 'settings',
                        label: 'Team Settings',
                        children: <TeamSettingsPage currentTeam={team} />,
                    },
                    {
                        key: 'knowledge',
                        label: 'Knowledge Base',
                        children: <KnowledgeBasePage currentTeam={team} />,
                    },
                ]}
            />
        </div>
    )
}

export default function App() {
    const { resolvedTheme } = useTheme()
    const { currentWorkspace, recentWorkspaces, loading, openWorkspace, closeWorkspace, removeRecent } = useWorkspace()
    const [session, setSession] = useState<{ userId: string; userName: string; email: string } | null>(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [teams, setTeams] = useState<{ id: string; name: string; slug: string }[]>([])
    const [currentTeam, setCurrentTeam] = useState<{ id: string; name: string; slug: string } | null>(null)
    const [currentProject, setCurrentProject] = useState<Project | null>(null)
    const [createTeamModalOpen, setCreateTeamModalOpen] = useState(false)
    const [createTeamForm] = Form.useForm()

    useEffect(() => {
        async function init() {
            // 1. Restore from localStorage (instant UI)
            const sess = getStoredSession()
            const token = getStoredToken()
            if (sess) setSession(sess)

            const cachedTeam = localStorage.getItem('ockham_current_team')
            const cachedTeams = localStorage.getItem('ockham_teams')
            if (cachedTeam) try { setCurrentTeam(JSON.parse(cachedTeam)) } catch { /* */ }
            if (cachedTeams) try { setTeams(JSON.parse(cachedTeams)) } catch { /* */ }

            setAuthLoading(false)

            // 2. If we have a token, load teams from server directly (bypasses IPC)
            if (token) {
                try {
                    const team = await ensureTeam()
                    setCurrentTeam(team)
                    localStorage.setItem('ockham_current_team', JSON.stringify(team))
                    const list = await listTeams()
                    setTeams(list)
                    localStorage.setItem('ockham_teams', JSON.stringify(list))
                } catch (err) {
                    console.warn('[App] Team loading failed:', err)
                }
            }
        }
        init()
    }, [])

    // Auto-resolve project from team + workspace
    useEffect(() => {
        if (!currentTeam || !currentWorkspace) {
            setCurrentProject(null)
            return
        }
        const slug = currentWorkspace.split('/').pop() || currentWorkspace
        ensureProject(currentTeam.id, slug, slug)
            .then((proj) => setCurrentProject(proj))
            .catch((err) => console.warn('[App] Project resolve failed:', err))
    }, [currentTeam, currentWorkspace])

    const handleCreateTeam = async (values: { name: string }) => {
        const slug = values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const newTeam = await createTeam(values.name, slug)
        // Refresh teams list
        const list = await listTeams()
        setTeams(list)
        localStorage.setItem('ockham_teams', JSON.stringify(list))
        // Switch to the new team
        setCurrentTeam(newTeam)
        localStorage.setItem('ockham_current_team', JSON.stringify(newTeam))
        setCreateTeamModalOpen(false)
        createTeamForm.resetFields()
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

    if (loading || authLoading) {
        return (
            <ConfigProvider theme={antdTheme}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <Spin size="large" />
                </div>
            </ConfigProvider>
        )
    }

    return (
        <ConfigProvider theme={antdTheme}>
            <AntdApp>
                <HashRouter>
                    <Routes>
                        <Route path="/team-settings-window" element={<TeamSettingsWindow />} />
                        <Route path="*" element={
                            <>
                                {!session ? (
                                    <LoginPage onLoginSuccess={async (s) => {
                                        setSession({ userId: s.userId, userName: s.userName, email: s.email })
                                        try {
                                            const team = await ensureTeam()
                                            setCurrentTeam(team)
                                            localStorage.setItem('ockham_current_team', JSON.stringify(team))
                                            const list = await listTeams()
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
                                        onLogout={() => {
                                            apiLogout()
                                            setSession(null)
                                            setCurrentTeam(null)
                                            setCurrentProject(null)
                                            setTeams([])
                                        }}
                                        onCloseProject={closeWorkspace}
                                        currentTeam={currentTeam}
                                        currentProject={currentProject}
                                        teams={teams}
                                        onSwitchTeam={(teamId) => {
                                            const t = teams.find((team) => team.id === teamId)
                                            if (t) {
                                                setCurrentTeam(t)
                                                localStorage.setItem('ockham_current_team', JSON.stringify(t))
                                            }
                                        }}
                                        onCreateTeam={async () => {
                                            setCreateTeamModalOpen(true)
                                        }}
                                    />
                                )}

                                <Modal
                                    title="Create Team"
                                    open={createTeamModalOpen}
                                    onCancel={() => { setCreateTeamModalOpen(false); createTeamForm.resetFields() }}
                                    footer={null}
                                    destroyOnClose
                                >
                                    <Form form={createTeamForm} layout="vertical" onFinish={handleCreateTeam}>
                                        <Form.Item
                                            name="name"
                                            label="Team Name"
                                            rules={[{ required: true, message: 'Please enter a team name' }]}
                                        >
                                            <Input placeholder="e.g. Engineering, Design..." />
                                        </Form.Item>
                                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                            <Space>
                                                <Button onClick={() => { setCreateTeamModalOpen(false); createTeamForm.resetFields() }}>
                                                    Cancel
                                                </Button>
                                                <Button type="primary" htmlType="submit">
                                                    Create
                                                </Button>
                                            </Space>
                                        </Form.Item>
                                    </Form>
                                </Modal>
                            </>
                        } />
                    </Routes>
                </HashRouter>
            </AntdApp>
        </ConfigProvider>
    )
}

