'use client'

import { useState } from 'react'
import { Card, Form, Input, Button, Typography, message, Divider } from 'antd'
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons'
import { signUp } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const { Text } = Typography

export default function RegisterPage() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const onFinish = async (values: { name: string; email: string; password: string }) => {
        setLoading(true)
        try {
            const result = await signUp.email({
                name: values.name,
                email: values.email,
                password: values.password,
            })
            if (result.error) {
                message.error(result.error.message || 'Registration failed')
            } else {
                message.success('Account created, redirecting...')
                router.push('/dashboard')
            }
        } catch {
            message.error('Registration failed, please try again')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <Card className="auth-card" variant="borderless">
                <div className="auth-logo">Ockham</div>
                <div className="auth-subtitle">Create a new account</div>
                <Form
                    name="register"
                    size="large"
                    onFinish={onFinish}
                    autoComplete="off"
                    layout="vertical"
                >
                    <Form.Item
                        name="name"
                        rules={[{ required: true, message: 'Please enter your name' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Name" />
                    </Form.Item>

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
                        rules={[
                            { required: true, message: 'Please enter a password' },
                            { min: 8, message: 'Password must be at least 8 characters' },
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
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
                        <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Sign Up
                        </Button>
                    </Form.Item>
                </Form>
                <Divider plain>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Already have an account?
                    </Text>
                </Divider>
                <Link href="/login">
                    <Button block>Back to Login</Button>
                </Link>
            </Card>
        </div>
    )
}
