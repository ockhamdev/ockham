import React, { useMemo, useState } from 'react'
import {
    Button,
    Table,
    Typography,
    Progress,
    Space,
    Spin,
    Tag,
    Statistic,
    Row,
    Col,
    Card,
    Drawer,
} from 'antd'
import {
    ScanOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCodeScan } from '../hooks/useCodeScan'
import type { FileEntry, SyntaxUnit } from '@ockham/shared'

const { Title, Text } = Typography

export function CodeScanPage() {
    const { result, loading, scanning, runScan } = useCodeScan()
    const [drawerFile, setDrawerFile] = useState<FileEntry | null>(null)

    const stats = useMemo(() => {
        if (!result) return null
        const scannedFiles = result.files.filter((f) => f.syntaxUnits.length > 0)
        const totalUnits = result.files.reduce((sum, f) => sum + f.syntaxUnits.length, 0)
        const avgCoverage =
            scannedFiles.length > 0
                ? Math.round(
                    (scannedFiles.reduce((sum, f) => sum + f.coveragePercent, 0) /
                        scannedFiles.length) *
                    100
                ) / 100
                : 0
        return {
            totalFiles: result.totalFiles,
            scannedFiles: scannedFiles.length,
            totalUnits,
            avgCoverage,
            scannedAt: result.scannedAt,
        }
    }, [result])

    const columns: ColumnsType<FileEntry> = [
        {
            title: 'File',
            dataIndex: 'filePath',
            key: 'filePath',
            sorter: (a, b) => a.filePath.localeCompare(b.filePath),
            render: (path: string) => (
                <Space>
                    <FileTextOutlined />
                    <Text code style={{ fontSize: 12 }}>
                        {path}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Total Lines',
            dataIndex: 'totalLines',
            key: 'totalLines',
            width: 120,
            align: 'right',
            sorter: (a, b) => a.totalLines - b.totalLines,
        },
        {
            title: 'Covered Lines',
            key: 'coveredLines',
            width: 130,
            align: 'right',
            sorter: (a, b) => a.coveredLines.length - b.coveredLines.length,
            render: (_: unknown, record: FileEntry) => record.coveredLines.length,
        },
        {
            title: 'Coverage',
            dataIndex: 'coveragePercent',
            key: 'coveragePercent',
            width: 200,
            sorter: (a, b) => a.coveragePercent - b.coveragePercent,
            defaultSortOrder: 'descend',
            render: (percent: number) => {
                const color =
                    percent >= 80 ? '#52c41a' : percent >= 50 ? '#faad14' : '#f5222d'
                return (
                    <Progress
                        percent={percent}
                        size="small"
                        strokeColor={color}
                        format={(p) => `${p}%`}
                    />
                )
            },
        },
        {
            title: 'Units',
            key: 'syntaxUnits',
            width: 100,
            align: 'right',
            sorter: (a, b) => a.syntaxUnits.length - b.syntaxUnits.length,
            render: (_: unknown, record: FileEntry) => (
                <Tag color={record.syntaxUnits.length > 0 ? 'blue' : 'default'}>
                    {record.syntaxUnits.length}
                </Tag>
            ),
        },
    ]

    const unitColumns: ColumnsType<SyntaxUnit> = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            width: 180,
            render: (type: string) => <Tag>{type}</Tag>,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'Location',
            key: 'location',
            width: 160,
            render: (_: unknown, record: SyntaxUnit) =>
                `L${record.startLine}:${record.startColumn} → L${record.endLine}:${record.endColumn}`,
        },
        {
            title: 'SHA1',
            dataIndex: 'sha1',
            key: 'sha1',
            width: 120,
            ellipsis: true,
            render: (sha1: string) => (
                <Text copyable={{ text: sha1 }} style={{ fontSize: 11 }}>
                    {sha1.substring(0, 10)}…
                </Text>
            ),
        },
    ]

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
                <Spin size="large" />
            </div>
        )
    }

    return (
        <div style={{ padding: 24 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    Code Scan
                </Title>
                <Button
                    type="primary"
                    icon={<ScanOutlined />}
                    loading={scanning}
                    onClick={runScan}
                >
                    {scanning ? 'Scanning...' : 'Run Scan'}
                </Button>
            </div>

            {stats && (
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                        <Card size="small">
                            <Statistic
                                title="Total Files"
                                value={stats.totalFiles}
                                prefix={<FileTextOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card size="small">
                            <Statistic
                                title="Scanned Files"
                                value={stats.scannedFiles}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card size="small">
                            <Statistic
                                title="Syntax Units"
                                value={stats.totalUnits}
                                prefix={<ScanOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card size="small">
                            <Statistic
                                title="Avg Coverage"
                                value={stats.avgCoverage}
                                suffix="%"
                                prefix={<ClockCircleOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {stats && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Last scanned: {new Date(stats.scannedAt).toLocaleString()}
                </Text>
            )}

            <Table<FileEntry>
                columns={columns}
                dataSource={result?.files || []}
                rowKey="filePath"
                size="small"
                pagination={{ pageSize: 50, showSizeChanger: true }}
                onRow={(record) => ({
                    style: { cursor: record.syntaxUnits.length > 0 ? 'pointer' : 'default' },
                    onClick: () => {
                        if (record.syntaxUnits.length > 0) {
                            setDrawerFile(record)
                        }
                    },
                })}
            />

            {/* Syntax Unit Drawer for a single file */}
            <Drawer
                title={
                    drawerFile && (
                        <Space>
                            <FileTextOutlined />
                            <Text code>{drawerFile.filePath}</Text>
                            <Tag color="blue">{drawerFile.syntaxUnits.length} units</Tag>
                        </Space>
                    )
                }
                open={!!drawerFile}
                onClose={() => setDrawerFile(null)}
                width={720}
                styles={{ body: { padding: 0 } }}
            >
                {drawerFile && (
                    <Table<SyntaxUnit>
                        columns={unitColumns}
                        dataSource={drawerFile.syntaxUnits}
                        rowKey={(unit) => `${unit.startLine}:${unit.sha1}`}
                        size="small"
                        pagination={false}
                        scroll={{ y: 'calc(100vh - 120px)' }}
                    />
                )}
            </Drawer>
        </div>
    )
}
