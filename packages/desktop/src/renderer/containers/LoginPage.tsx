import React, { useState } from 'react'
import { Button, Card, Form, Input, Typography, App as AntdApp, Space, Tabs } from 'antd'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { apiLogin, apiRegister } from '../api'

const { Title, Text } = Typography

interface LoginPageProps {
    onLoginSuccess: (session: { token: string; userId: string; userName: string; email: string }) => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [loading, setLoading] = useState(false)
    const { message } = AntdApp.useApp()

    const handleLogin = async (values: { email: string; password: string }) => {
        setLoading(true)
        try {
            const session = await apiLogin(values.email, values.password)
            message.success('Logged in successfully')
            onLoginSuccess(session)
        } catch (err: unknown) {
            message.error((err as Error).message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (values: { email: string; password: string }) => {
        setLoading(true)
        try {
            const session = await apiRegister(values.email, values.password)
            message.success('Account created successfully')
            onLoginSuccess(session)
        } catch (err: unknown) {
            message.error((err as Error).message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    const loginForm = (
        <Form layout="vertical" onFinish={handleLogin} autoComplete="off">
            <Form.Item
                name="email"
                rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Invalid email' },
                ]}
            >
                <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
            </Form.Item>

            <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please enter your password' }]}
            >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                    Sign In
                </Button>
            </Form.Item>
        </Form>
    )

    const registerForm = (
        <Form layout="vertical" onFinish={handleRegister} autoComplete="off">
            <Form.Item
                name="email"
                rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Invalid email' },
                ]}
            >
                <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
            </Form.Item>

            <Form.Item
                name="password"
                rules={[
                    { required: true, message: 'Please enter your password' },
                    { min: 8, message: 'Password must be at least 8 characters' },
                ]}
            >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>

            <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                    { required: true, message: 'Please confirm your password' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve()
                            }
                            return Promise.reject(new Error('Passwords do not match'))
                        },
                    }),
                ]}
            >
                <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" size="large" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                    Create Account
                </Button>
            </Form.Item>
        </Form>
    )

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'var(--color-bg, #f5f5f5)',
        }}>
            <Card
                style={{ width: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
                variant="borderless"
            >
                <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Title level={3} style={{ margin: 0 }}>Ockham</Title>
                        <Text type="secondary">Sign in or create an account</Text>
                    </div>

                    <Tabs
                        centered
                        items={[
                            { key: 'login', label: 'Sign In', children: loginForm },
                            { key: 'register', label: 'Sign Up', children: registerForm },
                        ]}
                    />
                </Space>
            </Card>
        </div>
    )
}
