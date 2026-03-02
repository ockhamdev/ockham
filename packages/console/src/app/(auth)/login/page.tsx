'use client'

import { useState } from 'react'
import { Card, Form, Input, Button, Typography, message, Divider } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { signIn } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const { Text } = Typography

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const onFinish = async (values: { email: string; password: string }) => {
        setLoading(true)
        try {
            const result = await signIn.email({
                email: values.email,
                password: values.password,
            })
            if (result.error) {
                message.error(result.error.message || 'Login failed')
            } else {
                message.success('Logged in successfully')
                router.push('/dashboard')
            }
        } catch {
            message.error('Login failed, please try again')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <Card className="auth-card" variant="borderless">
                <div className="auth-logo">Ockham</div>
                <div className="auth-subtitle">Sign in to your console</div>
                <Form
                    name="login"
                    size="large"
                    onFinish={onFinish}
                    autoComplete="off"
                    layout="vertical"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter your email' },
                            { type: 'email', message: 'Please enter a valid email' },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="Email" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please enter your password' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Sign In
                        </Button>
                    </Form.Item>
                </Form>
                <Divider plain>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Don&apos;t have an account?
                    </Text>
                </Divider>
                <Link href="/register">
                    <Button block>Create Account</Button>
                </Link>
            </Card>
        </div>
    )
}
