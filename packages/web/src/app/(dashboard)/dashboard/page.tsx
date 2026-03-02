'use client'

import { Card, Col, Row, Statistic } from 'antd'
import {
    TeamOutlined,
    ProjectOutlined,
    ReadOutlined,
    BookOutlined,
} from '@ant-design/icons'
import { trpc } from '@/lib/trpc-client'
import { useWorkspace } from '@/lib/workspace-context'

export default function DashboardPage() {
    const { teams, projects } = useWorkspace()
    const { data: _teams } = trpc.team.list.useQuery()

    return (
        <div>
            <div className="page-header">
                <div className="page-title">Dashboard</div>
            </div>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable style={{ borderRadius: 'var(--radius-md)' }}>
                        <Statistic
                            title="Teams"
                            value={teams.length}
                            prefix={<TeamOutlined />}
                            styles={{ content: { fontFamily: 'var(--font-display)' } }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable style={{ borderRadius: 'var(--radius-md)' }}>
                        <Statistic
                            title="Projects"
                            value={projects.length}
                            prefix={<ProjectOutlined />}
                            styles={{ content: { fontFamily: 'var(--font-display)' } }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable style={{ borderRadius: 'var(--radius-md)' }}>
                        <Statistic
                            title="Knowledge"
                            value={0}
                            prefix={<ReadOutlined />}
                            styles={{ content: { fontFamily: 'var(--font-display)' } }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable style={{ borderRadius: 'var(--radius-md)' }}>
                        <Statistic
                            title="Stories"
                            value={0}
                            prefix={<BookOutlined />}
                            styles={{ content: { fontFamily: 'var(--font-display)' } }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    )
}
