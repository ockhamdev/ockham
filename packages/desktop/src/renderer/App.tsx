import React, { useState } from 'react'
import { ConfigProvider, Layout, Menu, Dropdown, Button, Typography, theme as antTheme } from 'antd'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
    CodeOutlined,
    BookOutlined,
    ExperimentOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SettingOutlined,
    SunOutlined,
    MoonOutlined,
    DesktopOutlined,
    SwapOutlined,
    FolderOutlined,
    FileProtectOutlined,
    DashboardOutlined,
} from '@ant-design/icons'
import { useTheme, type ThemeMode } from './hooks/useTheme'
import { useWorkspace } from './hooks/useWorkspace'
import { WelcomePage } from './containers/WelcomePage'
import { DashboardPage } from './containers/DashboardPage'
import { CodePage } from './containers/CodePage'
import { StoryPage } from './containers/StoryPage'
import { UnitTestsPage } from './containers/TestsPage'
import { SpecTestsPage } from './containers/SpecTestsPage'
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
}

function AppLayout({ currentWorkspace, openWorkspace }: AppLayoutProps) {
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
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                    style={{ borderRight: 0 }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: 48,
                        left: 0,
                        right: 0,
                        padding: collapsed ? '0 8px' : '0 16px',
                    }}
                >
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
                            icon={<SettingOutlined />}
                            block
                            style={{ textAlign: 'left' }}
                        >
                            {!collapsed && 'Theme'}
                        </Button>
                    </Dropdown>
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
                </Header>
                <Content style={{ flex: 1, overflow: 'auto' }}>
                    <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/code" element={<CodePage />} />
                        <Route path="/story" element={<StoryPage />} />
                        <Route path="/unit-tests" element={<UnitTestsPage />} />
                        <Route path="/spec-tests" element={<SpecTestsPage />} />
                    </Routes>
                </Content>
            </Layout>
        </Layout>
    )
}

export default function App() {
    const { resolvedTheme } = useTheme()
    const { currentWorkspace, recentWorkspaces, loading, openWorkspace, removeRecent } = useWorkspace()

    if (loading) {
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
                {currentWorkspace ? (
                    <AppLayout
                        currentWorkspace={currentWorkspace}
                        openWorkspace={openWorkspace}
                    />
                ) : (
                    <WelcomePage
                        recentWorkspaces={recentWorkspaces}
                        openWorkspace={openWorkspace}
                        removeRecent={removeRecent}
                    />
                )}
            </HashRouter>
        </ConfigProvider>
    )
}
