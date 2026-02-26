import React, { useState } from 'react'
import { ConfigProvider, Layout, Menu, Dropdown, Button, theme as antTheme } from 'antd'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
    FileTextOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SettingOutlined,
    SunOutlined,
    MoonOutlined,
    DesktopOutlined,
} from '@ant-design/icons'
import { useTheme, type ThemeMode } from './hooks/useTheme'
import { useWorkspace } from './hooks/useWorkspace'
import { WelcomePage } from './containers/WelcomePage'
import { NotesPage } from './containers/NotesPage'
import './styles/global.css'

const { Sider, Content, Header } = Layout

const themeOptions: { key: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { key: 'system', label: 'System', icon: <DesktopOutlined /> },
    { key: 'light', label: 'Light', icon: <SunOutlined /> },
    { key: 'dark', label: 'Dark', icon: <MoonOutlined /> },
]

function AppLayout() {
    const [collapsed, setCollapsed] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const { mode, setMode } = useTheme()

    const menuItems = [
        {
            key: '/notes',
            icon: <FileTextOutlined />,
            label: 'Notes',
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
                }}
            >
                <Header
                    style={{
                        padding: '0 16px',
                        display: 'flex',
                        alignItems: 'center',
                        height: 44,
                        lineHeight: '44px',
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
                </Header>
                <Content style={{ overflow: 'auto' }}>
                    <Routes>
                        <Route path="/" element={<NotesPage />} />
                        <Route path="/notes" element={<NotesPage />} />
                    </Routes>
                </Content>
            </Layout>
        </Layout>
    )
}

export default function App() {
    const { resolvedTheme } = useTheme()
    const { currentWorkspace, loading } = useWorkspace()

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
                {currentWorkspace ? <AppLayout /> : <WelcomePage />}
            </HashRouter>
        </ConfigProvider>
    )
}
