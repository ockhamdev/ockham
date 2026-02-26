import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
    Tabs,
    Select,
    Input,
    Empty,
    Drawer,
    Segmented,
} from 'antd'
import {
    ScanOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    FolderOutlined,
    FilterOutlined,
    ApartmentOutlined,
    UnorderedListOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCodeScan } from '../hooks/useCodeScan'
import type { FileEntry, SyntaxUnit } from '@ockham/shared'

const { Title, Text } = Typography

// ────────────────────────────────────────────────────────
// Tree node for directory structure
// ────────────────────────────────────────────────────────
interface TreeFileEntry extends FileEntry {
    key: string
    children?: TreeFileEntry[]
    isDir?: boolean
}

function buildFileTree(files: FileEntry[]): TreeFileEntry[] {
    const root: TreeFileEntry[] = []
    const dirMap = new Map<string, TreeFileEntry>()

    // Sort files to ensure dirs appear before their children
    const sorted = [...files].sort((a, b) => a.filePath.localeCompare(b.filePath))

    for (const file of sorted) {
        const parts = file.filePath.split('/')
        let currentPath = ''

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            const parentPath = currentPath
            currentPath = currentPath ? `${currentPath}/${part}` : part

            if (i < parts.length - 1) {
                // Directory node
                if (!dirMap.has(currentPath)) {
                    const dirNode: TreeFileEntry = {
                        key: currentPath,
                        filePath: currentPath,
                        totalLines: 0,
                        coveredLines: [],
                        coveragePercent: 0,
                        syntaxUnits: [],
                        isDir: true,
                        children: [],
                    }
                    dirMap.set(currentPath, dirNode)

                    if (parentPath && dirMap.has(parentPath)) {
                        dirMap.get(parentPath)!.children!.push(dirNode)
                    } else if (!parentPath) {
                        root.push(dirNode)
                    }
                }
            } else {
                // File leaf node
                const fileNode: TreeFileEntry = {
                    ...file,
                    key: file.filePath,
                }
                if (parentPath && dirMap.has(parentPath)) {
                    dirMap.get(parentPath)!.children!.push(fileNode)
                } else {
                    root.push(fileNode)
                }
            }
        }
    }

    // Aggregate dir stats
    function aggregateDir(node: TreeFileEntry): void {
        if (!node.children) return
        let totalLines = 0
        let totalCovered = 0
        let totalUnits = 0
        const coveredSet = new Set<number>()

        for (const child of node.children) {
            if (child.isDir) aggregateDir(child)
            totalLines += child.totalLines
            totalCovered += child.coveredLines.length
            totalUnits += child.syntaxUnits.length
            child.coveredLines.forEach((l) => coveredSet.add(l))
        }
        node.totalLines = totalLines
        node.coveredLines = Array.from(coveredSet)
        node.coveragePercent = totalLines > 0
            ? Math.round((totalCovered / totalLines) * 10000) / 100
            : 0
        node.syntaxUnits = new Array(totalUnits) as SyntaxUnit[]
    }

    for (const node of root) {
        if (node.isDir) aggregateDir(node)
    }

    return root
}

// Types that should hide label in right sidebar
const HIDDEN_SIDEBAR_TYPES = new Set(['SingleLineComment', 'MultiLineComment', 'BlankLine'])

// ────────────────────────────────────────────────────────
// Code Viewer component
// ────────────────────────────────────────────────────────
interface CodeViewerProps {
    file: FileEntry
    highlightUnit?: SyntaxUnit | null
}

function CodeViewer({ file, highlightUnit }: CodeViewerProps) {
    const [state, setState] = useState<{ source: string | null; filePath: string; loaded: boolean }>({
        source: null,
        filePath: '',
        loaded: false,
    })

    const loading = !state.loaded || state.filePath !== file.filePath

    useEffect(() => {
        let cancelled = false
        window.codescanApi.getFileSource(file.filePath).then((src: string | null) => {
            if (!cancelled) {
                setState({ source: src, filePath: file.filePath, loaded: true })
            }
        })
        return () => { cancelled = true }
    }, [file.filePath])

    // Scroll to highlighted unit once source is loaded
    useEffect(() => {
        if (highlightUnit && !loading) {
            const el = document.getElementById(`code-line-${highlightUnit.startLine}`)
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }
    }, [highlightUnit, loading])

    const coveredSet = useMemo(() => new Set(file.coveredLines), [file.coveredLines])

    // Build a map: lineNumber → SyntaxUnit[]
    const lineUnitsMap = useMemo(() => {
        const map = new Map<number, SyntaxUnit[]>()
        for (const unit of file.syntaxUnits) {
            if (!map.has(unit.startLine)) {
                map.set(unit.startLine, [])
            }
            map.get(unit.startLine)!.push(unit)
        }
        return map
    }, [file.syntaxUnits])

    // Highlight range
    const highlightRange = useMemo(() => {
        if (!highlightUnit) return null
        return { start: highlightUnit.startLine, end: highlightUnit.endLine }
    }, [highlightUnit])

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Spin />
            </div>
        )
    }

    if (!state.source) {
        return <Empty description="Could not read file" />
    }

    const lines = state.source.split('\n')

    return (
        <div style={{ display: 'flex', fontFamily: 'monospace', fontSize: 14, lineHeight: '22px' }}>
            {/* Code area */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <tbody>
                        {lines.map((line: string, idx: number) => {
                            const lineNum = idx + 1
                            const isCovered = coveredSet.has(lineNum)
                            const isHighlighted = highlightRange
                                && lineNum >= highlightRange.start
                                && lineNum <= highlightRange.end
                            return (
                                <tr key={lineNum} id={`code-line-${lineNum}`}>
                                    {/* Coverage indicator */}
                                    <td
                                        style={{
                                            width: 4,
                                            padding: 0,
                                            background: isCovered ? '#52c41a' : '#f5222d33',
                                            borderRight: 'none',
                                        }}
                                    />
                                    {/* Line number */}
                                    <td
                                        style={{
                                            width: 50,
                                            textAlign: 'right',
                                            paddingRight: 12,
                                            paddingLeft: 8,
                                            color: isCovered ? '#52c41a' : '#999',
                                            userSelect: 'none',
                                            borderRight: '1px solid var(--border-color)',
                                            background: isHighlighted
                                                ? 'rgba(22, 119, 255, 0.12)'
                                                : isCovered
                                                    ? 'rgba(82, 196, 26, 0.05)'
                                                    : 'transparent',
                                        }}
                                    >
                                        {lineNum}
                                    </td>
                                    {/* Code */}
                                    <td
                                        style={{
                                            paddingLeft: 12,
                                            whiteSpace: 'pre',
                                            background: isHighlighted
                                                ? 'rgba(22, 119, 255, 0.08)'
                                                : isCovered
                                                    ? 'rgba(82, 196, 26, 0.03)'
                                                    : 'transparent',
                                        }}
                                    >
                                        {line || '\u00A0'}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Syntax unit sidebar — shows TYPE labels, hides comment/blank */}
            <div
                style={{
                    width: 240,
                    borderLeft: '1px solid var(--border-color)',
                    overflow: 'auto',
                    flexShrink: 0,
                }}
            >
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <tbody>
                        {lines.map((_: string, idx: number) => {
                            const lineNum = idx + 1
                            const units = lineUnitsMap.get(lineNum)
                            // Filter: only show non-comment/blank units in sidebar
                            const visibleUnits = units?.filter((u) => !HIDDEN_SIDEBAR_TYPES.has(u.type))
                            return (
                                <tr key={lineNum}>
                                    <td
                                        style={{
                                            height: 22,
                                            padding: '0 6px',
                                            fontSize: 12,
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipsis',
                                            color: '#1677ff',
                                        }}
                                        title={visibleUnits?.map((u) => u.type).join(', ')}
                                    >
                                        {visibleUnits?.map((u) => (
                                            <Tag
                                                key={`${u.startLine}-${u.type}-${u.name}`}
                                                style={{
                                                    fontSize: 11,
                                                    lineHeight: '18px',
                                                    padding: '0 6px',
                                                    marginRight: 2,
                                                }}
                                                color="blue"
                                            >
                                                {u.type}
                                            </Tag>
                                        ))}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ────────────────────────────────────────────────────────
// Main CodePage component
// ────────────────────────────────────────────────────────
export function CodePage() {
    const { result, loading, scanning, runScan } = useCodeScan()
    const [viewerFile, setViewerFile] = useState<FileEntry | null>(null)
    const [highlightUnit, setHighlightUnit] = useState<SyntaxUnit | null>(null)
    const [fileViewMode, setFileViewMode] = useState<'tree' | 'flat'>('tree')

    // Syntax units filter state
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [excludedTypes, setExcludedTypes] = useState<string[]>([])
    const [searchText, setSearchText] = useState('')

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

    // File tree
    const fileTree = useMemo(
        () => (result ? buildFileTree(result.files) : []),
        [result]
    )

    // All syntax units
    const allUnits = useMemo(
        () => (result ? result.files.flatMap((f) => f.syntaxUnits) : []),
        [result]
    )

    const allTypes = useMemo(() => {
        const types = new Set(allUnits.map((u) => u.type))
        return Array.from(types).sort()
    }, [allUnits])

    const filteredUnits = useMemo(() => {
        let units = allUnits
        if (selectedTypes.length > 0) {
            units = units.filter((u) => selectedTypes.includes(u.type))
        }
        if (excludedTypes.length > 0) {
            units = units.filter((u) => !excludedTypes.includes(u.type))
        }
        if (searchText) {
            const lower = searchText.toLowerCase()
            units = units.filter(
                (u) =>
                    u.name.toLowerCase().includes(lower) ||
                    u.filePath.toLowerCase().includes(lower)
            )
        }
        return units
    }, [allUnits, selectedTypes, excludedTypes, searchText])

    const typeDistribution = useMemo(() => {
        const map = new Map<string, number>()
        for (const u of filteredUnits) {
            map.set(u.type, (map.get(u.type) || 0) + 1)
        }
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    }, [filteredUnits])

    // Find full FileEntry when clicking from unit view
    const findFileEntry = useCallback(
        (filePath: string) => result?.files.find((f) => f.filePath === filePath) || null,
        [result]
    )

    // ── File columns (tree table)
    const fileColumns: ColumnsType<TreeFileEntry> = [
        {
            title: 'File',
            dataIndex: 'filePath',
            key: 'filePath',
            render: (path: string, record: TreeFileEntry) => (
                <Space>
                    {record.isDir ? <FolderOutlined /> : <FileTextOutlined />}
                    <Text code={!record.isDir} style={{ fontSize: 12 }}>
                        {path.split('/').pop()}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Lines',
            dataIndex: 'totalLines',
            key: 'totalLines',
            width: 80,
            align: 'right',
        },
        {
            title: 'Covered',
            key: 'coveredLines',
            width: 90,
            align: 'right',
            render: (_: unknown, record: TreeFileEntry) => record.coveredLines.length,
        },
        {
            title: 'Coverage',
            dataIndex: 'coveragePercent',
            key: 'coveragePercent',
            width: 160,
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
            key: 'units',
            width: 70,
            align: 'right',
            render: (_: unknown, record: TreeFileEntry) => (
                <Tag color={record.syntaxUnits.length > 0 ? 'blue' : 'default'}>
                    {record.syntaxUnits.length}
                </Tag>
            ),
        },
    ]

    // ── Syntax unit columns
    const unitColumns: ColumnsType<SyntaxUnit> = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            width: 180,
            filters: allTypes.map((t) => ({ text: t, value: t })),
            onFilter: (value, record) => record.type === value,
            render: (type: string) => <Tag>{type}</Tag>,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'File',
            dataIndex: 'filePath',
            key: 'filePath',
            ellipsis: true,
            sorter: (a, b) => a.filePath.localeCompare(b.filePath),
            render: (path: string) => (
                <Text code style={{ fontSize: 11 }}>
                    {path}
                </Text>
            ),
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
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    Code
                </Title>
                <Button
                    type="primary"
                    icon={<ScanOutlined />}
                    loading={scanning}
                    onClick={runScan}
                >
                    {scanning ? 'Scanning...' : 'Scan'}
                </Button>
            </div>

            {/* Stats */}
            {stats && (
                <>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={6}>
                            <Card size="small">
                                <Statistic title="Total Files" value={stats.totalFiles} prefix={<FileTextOutlined />} />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card size="small">
                                <Statistic title="Scanned" value={stats.scannedFiles} prefix={<CheckCircleOutlined />} />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card size="small">
                                <Statistic title="Syntax Units" value={stats.totalUnits} prefix={<ScanOutlined />} />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card size="small">
                                <Statistic title="Avg Coverage" value={stats.avgCoverage} suffix="%" prefix={<ClockCircleOutlined />} />
                            </Card>
                        </Col>
                    </Row>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
                        Last scanned: {new Date(stats.scannedAt).toLocaleString()}
                    </Text>
                </>
            )}

            {/* Tabs: Files / Syntax Units */}
            <Tabs
                defaultActiveKey="files"
                items={[
                    {
                        key: 'files',
                        label: 'By File',
                        children: (
                            <>
                                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Segmented
                                        size="small"
                                        value={fileViewMode}
                                        onChange={(v) => setFileViewMode(v as 'tree' | 'flat')}
                                        options={[
                                            { value: 'tree', icon: <ApartmentOutlined /> },
                                            { value: 'flat', icon: <UnorderedListOutlined /> },
                                        ]}
                                    />
                                </div>
                                {fileViewMode === 'tree' ? (
                                    <Table<TreeFileEntry>
                                        columns={fileColumns}
                                        dataSource={fileTree}
                                        rowKey="key"
                                        size="small"
                                        pagination={false}
                                        scroll={{ y: 'calc(100vh - 420px)' }}
                                        defaultExpandAllRows={false}
                                        onRow={(record) => ({
                                            style: { cursor: !record.isDir ? 'pointer' : 'default' },
                                            onClick: () => {
                                                if (!record.isDir) setViewerFile(record)
                                            },
                                        })}
                                    />
                                ) : (
                                    <Table<FileEntry>
                                        columns={fileColumns as ColumnsType<FileEntry>}
                                        dataSource={result?.files || []}
                                        rowKey="filePath"
                                        size="small"
                                        pagination={{ pageSize: 50, showSizeChanger: true }}
                                        onRow={(record) => ({
                                            style: { cursor: 'pointer' },
                                            onClick: () => setViewerFile(record),
                                        })}
                                    />
                                )}
                            </>
                        ),
                    },
                    {
                        key: 'units',
                        label: `Syntax Units (${filteredUnits.length})`,
                        children: (
                            <>
                                {/* Filters */}
                                <Space wrap style={{ marginBottom: 12 }}>
                                    <Input.Search
                                        placeholder="Search name or file…"
                                        allowClear
                                        style={{ width: 240 }}
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                    />
                                    <Select
                                        mode="multiple"
                                        placeholder={<><FilterOutlined /> Include…</>}
                                        options={allTypes.map((t) => ({ label: t, value: t }))}
                                        value={selectedTypes}
                                        onChange={setSelectedTypes}
                                        style={{ minWidth: 220 }}
                                        maxTagCount="responsive"
                                        allowClear
                                    />
                                    <Select
                                        mode="multiple"
                                        placeholder="Exclude…"
                                        options={allTypes.map((t) => ({ label: t, value: t }))}
                                        value={excludedTypes}
                                        onChange={setExcludedTypes}
                                        style={{ minWidth: 180 }}
                                        maxTagCount="responsive"
                                        allowClear
                                    />
                                </Space>
                                {/* Type distribution */}
                                <div style={{ marginBottom: 12 }}>
                                    <Space wrap size={[4, 4]}>
                                        {typeDistribution.map(([type, count]) => (
                                            <Tag
                                                key={type}
                                                color={selectedTypes.includes(type) ? 'blue' : 'default'}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => {
                                                    if (selectedTypes.includes(type)) {
                                                        setSelectedTypes(selectedTypes.filter((t) => t !== type))
                                                    } else {
                                                        setSelectedTypes([...selectedTypes, type])
                                                    }
                                                }}
                                            >
                                                {type}: {count}
                                            </Tag>
                                        ))}
                                    </Space>
                                </div>
                                <Table<SyntaxUnit>
                                    columns={unitColumns}
                                    dataSource={filteredUnits}
                                    rowKey={(u) => `${u.filePath}:${u.startLine}:${u.sha1}`}
                                    size="small"
                                    pagination={{ pageSize: 100, showSizeChanger: true, pageSizeOptions: ['50', '100', '200', '500'] }}
                                    onRow={(record) => ({
                                        style: { cursor: 'pointer' },
                                        onClick: () => {
                                            const entry = findFileEntry(record.filePath)
                                            if (entry) {
                                                setViewerFile(entry)
                                                setHighlightUnit(record)
                                            }
                                        },
                                    })}
                                />
                            </>
                        ),
                    },
                ]}
            />

            {/* Code Viewer Drawer */}
            <Drawer
                title={
                    viewerFile && (
                        <Space>
                            <FileTextOutlined />
                            <Text code>{viewerFile.filePath}</Text>
                            <Tag color="green">{viewerFile.coveragePercent}% covered</Tag>
                            <Tag color="blue">{viewerFile.syntaxUnits.length} units</Tag>
                        </Space>
                    )
                }
                open={!!viewerFile}
                onClose={() => { setViewerFile(null); setHighlightUnit(null) }}
                width="85vw"
                styles={{ body: { padding: 0 } }}
            >
                {viewerFile && <CodeViewer file={viewerFile} highlightUnit={highlightUnit} />}
            </Drawer>
        </div>
    )
}
