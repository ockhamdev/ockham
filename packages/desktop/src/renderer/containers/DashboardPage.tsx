import React, { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Typography, Spin, Progress, Space, Tag, Divider } from 'antd'
import {
    CodeOutlined,
    BookOutlined,
    ExperimentOutlined,
    FileProtectOutlined,
    FolderOutlined,
    FileTextOutlined,
    ApartmentOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons'
import type { ScanResult, TestCase, SpecTest, SpecTestGroup } from '@ockham/shared'
import type { CodeScanAPI, TestsAPI, SpecTestsAPI, StoryAPI } from '@ockham/shared'

const { Title, Text } = Typography

declare const window: Window &
    typeof globalThis & {
        codescanApi: CodeScanAPI
        testsApi: TestsAPI
        specTestsApi: SpecTestsAPI
        storyApi: StoryAPI
    }

interface DashboardStats {
    scan: ScanResult | null
    unitTests: TestCase[]
    specTests: SpecTest[]
    specGroups: SpecTestGroup[]
    stories: unknown[]
}

export function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            window.codescanApi.getResult().catch(() => null),
            window.testsApi.load().catch(() => []),
            window.specTestsApi.load().catch(() => []),
            window.specTestsApi.loadGroups().catch(() => []),
            window.storyApi.load().catch(() => []),
        ]).then(([scan, unitTests, specTests, specGroups, stories]) => {
            setStats({
                scan: scan as ScanResult | null,
                unitTests: unitTests as TestCase[],
                specTests: specTests as SpecTest[],
                specGroups: specGroups as SpecTestGroup[],
                stories: stories as unknown[],
            })
            setLoading(false)
        })
    }, [])

    if (loading || !stats) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Spin size="large" />
            </div>
        )
    }

    // Compute scan stats
    const totalFiles = stats.scan?.totalFiles ?? 0
    const totalUnits = stats.scan?.files.reduce((sum, f) => sum + f.syntaxUnits.length, 0) ?? 0
    const totalLines = stats.scan?.files.reduce((sum, f) => sum + f.totalLines, 0) ?? 0
    const avgCoverage = totalFiles > 0
        ? Math.round(stats.scan!.files.reduce((sum, f) => sum + f.coveragePercent, 0) / totalFiles)
        : 0

    // Type distribution
    const typeMap = new Map<string, number>()
    stats.scan?.files.forEach((f) => {
        f.syntaxUnits.forEach((u) => {
            typeMap.set(u.type, (typeMap.get(u.type) ?? 0) + 1)
        })
    })
    const typeDistribution = [...typeMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)

    // File extensions distribution
    const extMap = new Map<string, number>()
    stats.scan?.files.forEach((f) => {
        const ext = f.filePath.split('.').pop()?.toLowerCase() ?? 'other'
        extMap.set(ext, (extMap.get(ext) ?? 0) + 1)
    })
    const extDistribution = [...extMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)

    const cardStyle: React.CSSProperties = {
        borderRadius: 12,
        height: '100%',
    }

    const iconStyle = (color: string): React.CSSProperties => ({
        fontSize: 28,
        color,
        padding: 12,
        borderRadius: 12,
        background: `${color}18`,
    })

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <Title level={3} style={{ marginBottom: 24 }}>Dashboard</Title>

            {/* Stat Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={cardStyle} variant="borderless">
                        <Space align="start" size={16}>
                            <FolderOutlined style={iconStyle('#1677ff')} />
                            <Statistic title="Scanned Files" value={totalFiles} />
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={cardStyle} variant="borderless">
                        <Space align="start" size={16}>
                            <ApartmentOutlined style={iconStyle('#722ed1')} />
                            <Statistic title="Syntax Units" value={totalUnits} />
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={cardStyle} variant="borderless">
                        <Space align="start" size={16}>
                            <FileTextOutlined style={iconStyle('#13c2c2')} />
                            <Statistic title="Total Lines" value={totalLines} valueStyle={{ fontSize: 24 }} />
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={cardStyle} variant="borderless">
                        <Space align="start" size={16}>
                            <CheckCircleOutlined style={iconStyle('#52c41a')} />
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>Avg Coverage</Text>
                                <div style={{ marginTop: 4 }}>
                                    <Progress
                                        type="dashboard"
                                        percent={avgCoverage}
                                        size={64}
                                        strokeWidth={8}
                                    />
                                </div>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* Tests & Stories */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card style={cardStyle} variant="borderless">
                        <Space align="start" size={16}>
                            <ExperimentOutlined style={iconStyle('#fa8c16')} />
                            <Statistic title="Unit Tests" value={stats.unitTests.length} />
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card style={cardStyle} variant="borderless">
                        <Space align="start" size={16}>
                            <FileProtectOutlined style={iconStyle('#eb2f96')} />
                            <div>
                                <Statistic title="Spec Tests" value={stats.specTests.length} />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {stats.specGroups.length} group{stats.specGroups.length !== 1 ? 's' : ''}
                                </Text>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card style={cardStyle} variant="borderless">
                        <Space align="start" size={16}>
                            <BookOutlined style={iconStyle('#2f54eb')} />
                            <Statistic title="Stories" value={stats.stories.length} />
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* Type Distribution & File Extensions */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                    <Card
                        title={
                            <Space>
                                <CodeOutlined />
                                <span>Syntax Unit Types</span>
                            </Space>
                        }
                        style={cardStyle}
                        variant="borderless"
                    >
                        {typeDistribution.length === 0 ? (
                            <Text type="secondary">No scan data. Run a code scan first.</Text>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {typeDistribution.map(([type, count]) => (
                                    <Tag
                                        key={type}
                                        style={{
                                            padding: '4px 12px',
                                            fontSize: 13,
                                            borderRadius: 6,
                                        }}
                                    >
                                        <Text strong>{type}</Text>
                                        <Divider type="vertical" />
                                        <Text type="secondary">{count}</Text>
                                    </Tag>
                                ))}
                            </div>
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card
                        title={
                            <Space>
                                <FolderOutlined />
                                <span>File Types</span>
                            </Space>
                        }
                        style={cardStyle}
                        variant="borderless"
                    >
                        {extDistribution.length === 0 ? (
                            <Text type="secondary">No scan data.</Text>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {extDistribution.map(([ext, count]) => {
                                    const pct = totalFiles > 0 ? Math.round((count / totalFiles) * 100) : 0
                                    return (
                                        <div key={ext} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Text code style={{ width: 50, textAlign: 'right', fontSize: 12 }}>
                                                .{ext}
                                            </Text>
                                            <Progress
                                                percent={pct}
                                                size="small"
                                                style={{ flex: 1, marginBottom: 0 }}
                                                format={() => `${count}`}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    )
}
