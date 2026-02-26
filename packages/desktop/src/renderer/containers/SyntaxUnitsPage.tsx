import React, { useMemo, useState } from 'react'
import {
    Table,
    Typography,
    Tag,
    Select,
    Space,
    Spin,
    Input,
    Empty,
} from 'antd'
import { FilterOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCodeScan } from '../hooks/useCodeScan'
import type { SyntaxUnit } from '@ockham/shared'

const { Title, Text } = Typography

export function SyntaxUnitsPage() {
    const { result, loading } = useCodeScan()

    // Filter state
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [excludedTypes, setExcludedTypes] = useState<string[]>([])
    const [searchText, setSearchText] = useState('')

    // All syntax units flattened
    const allUnits = useMemo(() => {
        if (!result) return []
        return result.files.flatMap((f) => f.syntaxUnits)
    }, [result])

    // All unique syntax unit types for filter options
    const allTypes = useMemo(() => {
        const types = new Set(allUnits.map((u) => u.type))
        return Array.from(types).sort()
    }, [allUnits])

    // Filtered units
    const filteredUnits = useMemo(() => {
        let units = allUnits

        // Include filter (if any selected, show only those)
        if (selectedTypes.length > 0) {
            units = units.filter((u) => selectedTypes.includes(u.type))
        }

        // Exclude filter
        if (excludedTypes.length > 0) {
            units = units.filter((u) => !excludedTypes.includes(u.type))
        }

        // Name search
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

    // Type distribution for tags
    const typeDistribution = useMemo(() => {
        const map = new Map<string, number>()
        for (const u of filteredUnits) {
            map.set(u.type, (map.get(u.type) || 0) + 1)
        }
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    }, [filteredUnits])

    const columns: ColumnsType<SyntaxUnit> = [
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

    if (!result) {
        return (
            <div style={{ padding: 24 }}>
                <Empty description="No scan result. Go to Code Scan and run a scan first." />
            </div>
        )
    }

    return (
        <div style={{ padding: 24 }}>
            <Title level={3} style={{ marginBottom: 24 }}>
                Syntax Units
            </Title>

            {/* Filter bar */}
            <Space wrap style={{ marginBottom: 16, width: '100%' }}>
                <Input.Search
                    placeholder="Search by name or file…"
                    allowClear
                    style={{ width: 260 }}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
                <Select
                    mode="multiple"
                    placeholder={
                        <Space>
                            <FilterOutlined />
                            <span>Include types…</span>
                        </Space>
                    }
                    options={allTypes.map((t) => ({ label: t, value: t }))}
                    value={selectedTypes}
                    onChange={setSelectedTypes}
                    style={{ minWidth: 240 }}
                    maxTagCount="responsive"
                    allowClear
                />
                <Select
                    mode="multiple"
                    placeholder="Exclude types…"
                    options={allTypes.map((t) => ({ label: t, value: t }))}
                    value={excludedTypes}
                    onChange={setExcludedTypes}
                    style={{ minWidth: 200 }}
                    maxTagCount="responsive"
                    allowClear
                />
            </Space>

            {/* Type distribution */}
            <div style={{ marginBottom: 16 }}>
                <Space wrap size={[4, 4]}>
                    {typeDistribution.map(([type, count]) => (
                        <Tag
                            key={type}
                            color="blue"
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

            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                Showing {filteredUnits.length} of {allUnits.length} units
            </Text>

            <Table<SyntaxUnit>
                columns={columns}
                dataSource={filteredUnits}
                rowKey={(unit) => `${unit.filePath}:${unit.startLine}:${unit.sha1}`}
                size="small"
                pagination={{ pageSize: 100, showSizeChanger: true, pageSizeOptions: ['50', '100', '200', '500'] }}
            />
        </div>
    )
}
