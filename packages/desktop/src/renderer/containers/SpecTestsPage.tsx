import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Button,
    Input,
    Typography,
    Table,
    Space,
    Drawer,
    Modal,
    Form,
    message,
    Empty,
    Tag,
    Popconfirm,
    Spin,
    Tree,
    TreeSelect,
} from 'antd'
import {
    PlusOutlined,
    DeleteOutlined,
    EditOutlined,
    WarningOutlined,
    ThunderboltOutlined,
    MinusCircleOutlined,
    EyeOutlined,
    CopyOutlined,
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import type { SpecTest, SpecTestUnit, SpecTestGroup, SyntaxUnit } from '@ockham/shared'
import { SourceViewer } from '../components/SourceViewer'
import { MarkdownViewer } from '../components/MarkdownViewer'
import '../styles/spec-group-tree.css'

const { Title, Text } = Typography
const { TextArea } = Input

// ── Compute SHA-1 hash ──
async function computeSha1(text: string): Promise<string> {
    const data = new TextEncoder().encode(text)
    const hashBuf = await crypto.subtle.digest('SHA-1', data)
    return Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

// ── Parse path into filePath and keyword ──
function parsePath(p: string): { filePath: string; keyword: string } {
    const idx = p.indexOf(' ')
    if (idx === -1) return { filePath: p, keyword: '' }
    return { filePath: p.substring(0, idx), keyword: p.substring(idx + 1).trim() }
}

// ── Build tree data from flat groups ──
function buildGroupTree(
    groups: SpecTestGroup[],
    selectedGroup: string,
    onSelect: (key: string) => void,
    onEdit: (group: SpecTestGroup) => void,
    onDelete: (key: string) => void,
): DataNode[] {
    const childrenMap = new Map<string | undefined, SpecTestGroup[]>()
    for (const g of groups) {
        const parentKey = g.parentKey || undefined
        if (!childrenMap.has(parentKey)) childrenMap.set(parentKey, [])
        childrenMap.get(parentKey)!.push(g)
    }

    function buildNodes(parentKey: string | undefined): DataNode[] {
        const children = childrenMap.get(parentKey) || []
        return children.map((g) => ({
            key: g.key,
            title: (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                    }}
                >
                    <span style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 13,
                    }}>
                        {g.name}
                    </span>
                    <span className="group-actions" style={{ flexShrink: 0, marginLeft: 4, display: 'inline-flex', gap: 0 }}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined style={{ fontSize: 11 }} />}
                            onClick={(e) => { e.stopPropagation(); onEdit(g) }}
                            style={{ width: 22, height: 22, minWidth: 22 }}
                        />
                        {g.key !== 'default' && (
                            <Popconfirm
                                title="Delete this group? Tests will be moved to parent group."
                                onConfirm={(e) => { e?.stopPropagation(); onDelete(g.key) }}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ width: 22, height: 22, minWidth: 22 }}
                                />
                            </Popconfirm>
                        )}
                    </span>
                </div>
            ),
            children: buildNodes(g.key),
        }))
    }

    return buildNodes(undefined)
}

// ── Build TreeSelect data for parent selection ──
function buildParentTreeSelectData(
    groups: SpecTestGroup[],
    excludeKey?: string,
): { value: string; title: string; children?: ReturnType<typeof buildParentTreeSelectData> }[] {
    const childrenMap = new Map<string | undefined, SpecTestGroup[]>()
    for (const g of groups) {
        if (g.key === excludeKey) continue // Exclude self and descendants
        const pk = g.parentKey || undefined
        if (!childrenMap.has(pk)) childrenMap.set(pk, [])
        childrenMap.get(pk)!.push(g)
    }

    function buildNodes(parentKey: string | undefined): ReturnType<typeof buildParentTreeSelectData> {
        const children = childrenMap.get(parentKey) || []
        return children.map((g) => ({
            value: g.key,
            title: g.name,
            children: buildNodes(g.key),
        }))
    }

    return buildNodes(undefined)
}

// ── Unit path row (for creating/editing spec test) ──
function UnitPathRow({
    value,
    onChange,
    onRemove,
    onLookup,
    onPreview,
    onClearUnit,
    resolvedUnit,
    lookingUp,
}: {
    value: string
    onChange: (v: string) => void
    onRemove: () => void
    onLookup: () => void
    onPreview: () => void
    onClearUnit: () => void
    resolvedUnit: SpecTestUnit | null
    lookingUp: boolean
}) {
    // Resolved state — show display card
    if (resolvedUnit) {
        return (
            <div
                style={{
                    marginBottom: 8,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--ant-color-border)',
                    background: 'var(--ant-color-bg-container)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <div
                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    onClick={onPreview}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text strong style={{ fontSize: 13 }}>{resolvedUnit.unitName}</Text>
                        <Tag color="blue" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
                            {resolvedUnit.unitType}
                        </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>{resolvedUnit.unitFilePath}</Text>
                </div>
                <Space size={0} style={{ flexShrink: 0 }}>
                    <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined style={{ fontSize: 12 }} />}
                        onClick={onPreview}
                        title="Preview source"
                        style={{ width: 26, height: 26, minWidth: 26 }}
                    />
                    <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined style={{ fontSize: 12 }} />}
                        onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(value)
                            message.success('Path copied')
                        }}
                        title="Copy path"
                        style={{ width: 26, height: 26, minWidth: 26 }}
                    />
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined style={{ fontSize: 12 }} />}
                        onClick={onClearUnit}
                        title="Edit path"
                        style={{ width: 26, height: 26, minWidth: 26 }}
                    />
                    <Button
                        type="text"
                        danger
                        size="small"
                        icon={<MinusCircleOutlined style={{ fontSize: 12 }} />}
                        onClick={onRemove}
                        title="Remove"
                        style={{ width: 26, height: 26, minWidth: 26 }}
                    />
                </Space>
            </div>
        )
    }

    // Input state — show lookup input
    return (
        <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="filepath keyword — e.g. src/App.tsx CodePage"
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}
                    onPressEnter={onLookup}
                    disabled={lookingUp}
                    suffix={lookingUp ? <Spin size="small" /> : undefined}
                />
                <Button size="small" onClick={onLookup} loading={lookingUp}>
                    Lookup
                </Button>
                <Button type="text" danger size="small" icon={<MinusCircleOutlined />} onClick={onRemove} />
            </div>
        </div>
    )
}

// ── Spec Test Drawer (Create / Edit) ──
function SpecTestDrawer({
    open,
    onCancel,
    onSave,
    mode,
    editingTest,
    groups,
    selectedGroup,
}: {
    open: boolean
    onCancel: () => void
    onSave: (st: SpecTest) => void
    mode: 'create' | 'edit'
    editingTest?: SpecTest | null
    groups: SpecTestGroup[]
    selectedGroup: string
}) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [group, setGroup] = useState(selectedGroup)
    const [pathInputs, setPathInputs] = useState<string[]>([''])
    const [resolvedUnits, setResolvedUnits] = useState<(SpecTestUnit | null)[]>([null])
    const [lookingUpIdx, setLookingUpIdx] = useState<number | null>(null)

    // Multi-match modal
    const [matchCandidates, setMatchCandidates] = useState<SyntaxUnit[]>([])
    const [showMatchModal, setShowMatchModal] = useState(false)
    const [matchPathIdx, setMatchPathIdx] = useState(0)

    // Source preview state
    const [previewUnit, setPreviewUnit] = useState<SyntaxUnit | null>(null)
    const [previewSource, setPreviewSource] = useState<string | null>(null)
    const [previewLoading, setPreviewLoading] = useState(false)

    // Reset on open
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && editingTest) {
                setTitle(editingTest.title)
                setDescription(editingTest.description)
                setGroup(editingTest.group || selectedGroup)
                setPathInputs(editingTest.units.map((u) => u.path))
                setResolvedUnits(editingTest.units.map((u) => ({ ...u })))
            } else {
                setTitle('')
                setDescription('')
                setGroup(selectedGroup)
                setPathInputs([''])
                setResolvedUnits([null])
            }
        }
    }, [open, mode, editingTest, selectedGroup])

    const handleLookup = useCallback(async (idx: number) => {
        const val = pathInputs[idx]?.trim()
        if (!val) return
        const { filePath, keyword } = parsePath(val)
        if (!keyword) {
            message.warning('格式：filepath keyword')
            return
        }
        setLookingUpIdx(idx)
        try {
            const units = await window.specTestsApi.lookupUnit(filePath, keyword)
            if (units.length === 0) {
                message.error(`未找到匹配 "${keyword}" 的语法单元`)
            } else if (units.length === 1) {
                const u = units[0]
                const resolved: SpecTestUnit = {
                    path: val,
                    unitName: u.name,
                    unitType: u.type,
                    unitFilePath: u.filePath,
                    contentHash: u.sha1,
                }
                const newUnits = [...resolvedUnits]
                newUnits[idx] = resolved
                setResolvedUnits(newUnits)
            } else {
                setMatchCandidates(units)
                setMatchPathIdx(idx)
                setShowMatchModal(true)
            }
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Lookup failed')
        }
        setLookingUpIdx(null)
    }, [pathInputs, resolvedUnits])

    const handleSelectMatch = useCallback(async (unit: SyntaxUnit) => {
        const idx = matchPathIdx
        const resolved: SpecTestUnit = {
            path: pathInputs[idx],
            unitName: unit.name,
            unitType: unit.type,
            unitFilePath: unit.filePath,
            contentHash: unit.sha1,
        }
        const newUnits = [...resolvedUnits]
        newUnits[idx] = resolved
        setResolvedUnits(newUnits)
        setShowMatchModal(false)
        setMatchCandidates([])
    }, [matchPathIdx, pathInputs, resolvedUnits])

    const handleAddPath = useCallback(() => {
        setPathInputs([...pathInputs, ''])
        setResolvedUnits([...resolvedUnits, null])
    }, [pathInputs, resolvedUnits])

    const handleRemovePath = useCallback((idx: number) => {
        if (pathInputs.length <= 1) return
        setPathInputs(pathInputs.filter((_, i) => i !== idx))
        setResolvedUnits(resolvedUnits.filter((_, i) => i !== idx))
    }, [pathInputs, resolvedUnits])

    const handlePathChange = useCallback((idx: number, val: string) => {
        const newPaths = [...pathInputs]
        newPaths[idx] = val
        setPathInputs(newPaths)
        // Clear resolved unit on path change
        const newUnits = [...resolvedUnits]
        newUnits[idx] = null
        setResolvedUnits(newUnits)
    }, [pathInputs, resolvedUnits])

    const handlePreview = useCallback(async (idx: number) => {
        const unit = resolvedUnits[idx]
        if (!unit) return
        setPreviewLoading(true)
        try {
            const { filePath, keyword } = parsePath(unit.path)
            const units = await window.specTestsApi.lookupUnit(filePath, keyword)
            if (units.length > 0) {
                setPreviewUnit(units[0])
                const src = await window.codescanApi.getFileSource(units[0].filePath)
                setPreviewSource(src || '// File not found')
            } else {
                message.warning('No matching syntax unit found')
            }
        } catch {
            message.error('Failed to load source')
        }
        setPreviewLoading(false)
    }, [resolvedUnits])

    const handleSave = useCallback(async () => {
        if (!title.trim()) {
            message.warning('请输入测试标题')
            return
        }
        // Filter out empty paths and their resolved units
        const validPairs: SpecTestUnit[] = []
        for (let i = 0; i < pathInputs.length; i++) {
            if (pathInputs[i].trim() && resolvedUnits[i]) {
                validPairs.push(resolvedUnits[i]!)
            }
        }
        if (validPairs.length === 0) {
            message.warning('请至少添加一个已 Lookup 的语法单元')
            return
        }

        let id: string
        if (mode === 'edit' && editingTest) {
            id = editingTest.id
        } else {
            // sha1(uuid)
            const uuid = crypto.randomUUID()
            id = await computeSha1(uuid)
        }

        const spec: SpecTest = {
            id,
            title: title.trim(),
            group,
            description: description.trim(),
            units: validPairs,
            createdAt: editingTest?.createdAt || new Date().toISOString(),
        }
        onSave(spec)
    }, [title, description, group, pathInputs, resolvedUnits, mode, editingTest, onSave])

    return (
        <>
            <Drawer
                title={mode === 'edit' ? 'Edit Spec Test' : 'New Spec Test'}
                open={open}
                onClose={onCancel}
                width="90vw"
                placement="right"
                extra={
                    <Button type="primary" onClick={handleSave}>
                        {mode === 'edit' ? 'Update' : 'Create'}
                    </Button>
                }
            >
                <div style={{ display: 'flex', gap: 24, height: '100%' }}>
                    {/* Left: Form */}
                    <div style={{ flex: '0 0 480px', overflow: 'auto' }}>
                        <Form layout="vertical">
                            <Form.Item label="Title" required>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="测试标题"
                                />
                            </Form.Item>

                            <Form.Item label="Group">
                                <TreeSelect
                                    value={group}
                                    onChange={setGroup}
                                    treeData={buildParentTreeSelectData(groups)}
                                    treeDefaultExpandAll
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>

                            <Form.Item label="Syntax Units" required>
                                <div style={{
                                    background: 'var(--ant-color-bg-layout)',
                                    borderRadius: 8,
                                    padding: '12px',
                                    border: '1px solid var(--ant-color-border)',
                                }}>
                                    {pathInputs.map((p, idx) => (
                                        <UnitPathRow
                                            key={idx}
                                            value={p}
                                            onChange={(v) => handlePathChange(idx, v)}
                                            onRemove={() => handleRemovePath(idx)}
                                            onLookup={() => handleLookup(idx)}
                                            onPreview={() => handlePreview(idx)}
                                            onClearUnit={() => {
                                                const newUnits = [...resolvedUnits]
                                                newUnits[idx] = null
                                                setResolvedUnits(newUnits)
                                            }}
                                            resolvedUnit={resolvedUnits[idx]}
                                            lookingUp={lookingUpIdx === idx}
                                        />
                                    ))}
                                    <Button
                                        type="dashed"
                                        onClick={handleAddPath}
                                        icon={<PlusOutlined />}
                                        size="small"
                                        block
                                        style={{ marginTop: 4 }}
                                    >
                                        Add Path
                                    </Button>
                                </div>
                            </Form.Item>

                            <Form.Item label="Requirements">
                                <TextArea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="这些语法单元如何协作？测试应验证什么？"
                                    rows={6}
                                />
                            </Form.Item>
                        </Form>
                    </div>

                    {/* Right: Source Preview */}
                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        background: 'var(--ant-color-bg-layout)',
                        borderRadius: 8,
                        border: '1px solid var(--ant-color-border)',
                        fontFamily: 'monospace',
                        fontSize: 13,
                        lineHeight: 1.6,
                    }}>
                        {previewLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <Spin size="large" />
                            </div>
                        ) : previewUnit && previewSource ? (
                            <>
                                <div style={{
                                    padding: '8px 16px',
                                    borderBottom: '1px solid var(--ant-color-border)',
                                    background: 'var(--ant-color-bg-container)',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <Space size={8}>
                                        <Tag color="blue">{previewUnit.type}</Tag>
                                        <Text strong style={{ fontSize: 13 }}>{previewUnit.name}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{previewUnit.filePath}</Text>
                                    </Space>
                                    <Button
                                        type="text"
                                        size="small"
                                        onClick={() => { setPreviewUnit(null); setPreviewSource(null) }}
                                    >
                                        ✕
                                    </Button>
                                </div>
                                <SourceViewer
                                    source={previewSource}
                                    filePath={previewUnit.filePath}
                                    highlightStart={previewUnit.startLine}
                                    highlightEnd={previewUnit.endLine}
                                    style={{ flex: 1 }}
                                />
                            </>
                        ) : (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                color: 'var(--ant-color-text-quaternary)',
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <EyeOutlined style={{ fontSize: 32, marginBottom: 12 }} />
                                    <div style={{ fontSize: 13 }}>点击语法单元预览源码</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Drawer>

            {/* Multi-match selection modal */}
            <Modal
                title={
                    <Space>
                        <WarningOutlined style={{ color: '#faad14' }} />
                        <span>匹配到 {matchCandidates.length} 个语法单元，请选择</span>
                    </Space>
                }
                open={showMatchModal}
                onCancel={() => { setShowMatchModal(false); setMatchCandidates([]) }}
                footer={null}
                width={600}
            >
                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                    {matchCandidates.map((u, idx) => (
                        <div
                            key={idx}
                            style={{
                                padding: '10px 12px',
                                marginBottom: 8,
                                borderRadius: 6,
                                border: '1px solid var(--ant-color-border)',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                            onClick={() => handleSelectMatch(u)}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ant-color-primary-bg)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                        >
                            <Space>
                                <Tag color="blue">{u.type}</Tag>
                                <Text code>{u.name}</Text>
                            </Space>
                            <div style={{ marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {u.filePath}
                                </Text>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>
        </>
    )
}

// ── Group Editor Drawer ──
function GroupEditorDrawer({
    open,
    group,
    groups,
    onCancel,
    onSave,
}: {
    open: boolean
    group: SpecTestGroup | null
    groups: SpecTestGroup[]
    onCancel: () => void
    onSave: (g: SpecTestGroup) => void
}) {
    const [name, setName] = useState('')
    const [preconditions, setPreconditions] = useState('')
    const [parentKey, setParentKey] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (open && group) {
            setName(group.name)
            setPreconditions(group.preconditions)
            setParentKey(group.parentKey || undefined)
        } else if (open) {
            setName('')
            setPreconditions('')
            setParentKey('default')
        }
    }, [open, group])

    const isDefault = group?.key === 'default'

    const parentTreeData = useMemo(() => {
        return buildParentTreeSelectData(groups, group?.key)
    }, [groups, group])

    // Build ancestor chain: walk up from current parentKey
    const ancestorChain = useMemo(() => {
        const groupMap = new Map(groups.map((g) => [g.key, g]))
        const chain: SpecTestGroup[] = []

        // For editing: use the group's parentKey; for new: use current parentKey
        let currentKey = group ? group.parentKey : parentKey
        while (currentKey) {
            const ancestor = groupMap.get(currentKey)
            if (!ancestor) break
            chain.unshift(ancestor) // prepend to get root-first order
            currentKey = ancestor.parentKey
        }
        return chain
    }, [groups, group, parentKey])

    const handleSave = useCallback(async () => {
        if (!name.trim()) {
            message.warning('请输入分组名称')
            return
        }
        const key: string = group?.key ?? await computeSha1(crypto.randomUUID()).then((h) => h.slice(0, 12))
        onSave({
            key,
            name: name.trim(),
            parentKey: isDefault ? undefined : parentKey,
            preconditions: preconditions.trim(),
        })
    }, [name, preconditions, parentKey, group, isDefault, onSave])

    return (
        <Drawer
            title={group ? 'Edit Group' : 'New Group'}
            open={open}
            onClose={onCancel}
            width={520}
            extra={
                <Button type="primary" onClick={handleSave}>
                    {group ? 'Update' : 'Create'}
                </Button>
            }
        >
            {/* Ancestor chain display */}
            {ancestorChain.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                        Ancestor Path
                    </Text>
                    <div style={{
                        background: 'var(--ant-color-bg-layout)',
                        borderRadius: 8,
                        border: '1px solid var(--ant-color-border)',
                        overflow: 'hidden',
                    }}>
                        {ancestorChain.map((ancestor, idx) => (
                            <div
                                key={ancestor.key}
                                style={{
                                    padding: '10px 14px',
                                    borderBottom: idx < ancestorChain.length - 1 ? '1px solid var(--ant-color-border)' : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: ancestor.preconditions ? 4 : 0 }}>
                                    <Text style={{ fontSize: 11, color: 'var(--ant-color-text-quaternary)' }}>
                                        {'›'.repeat(idx + 1)}
                                    </Text>
                                    <Text strong style={{ fontSize: 13 }}>{ancestor.name}</Text>
                                </div>
                                {ancestor.preconditions && (
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            display: 'block',
                                            paddingLeft: (idx + 1) * 8 + 14,
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {ancestor.preconditions}
                                    </Text>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Form layout="vertical">
                <Form.Item label="Group Name" required>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Auth, Payment"
                    />
                </Form.Item>
                {!isDefault && (
                    <Form.Item label="Parent Group">
                        <TreeSelect
                            value={parentKey}
                            onChange={(v) => setParentKey(v || undefined)}
                            treeData={parentTreeData}
                            placeholder="Root level (no parent)"
                            allowClear
                            treeDefaultExpandAll
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                )}
                <Form.Item label="Preconditions">
                    <TextArea
                        value={preconditions}
                        onChange={(e) => setPreconditions(e.target.value)}
                        placeholder="前置条件，如：需要统一登录、需要初始化数据库"
                        rows={4}
                    />
                </Form.Item>
            </Form>
        </Drawer>
    )
}

// ── Main SpecTestsPage ──
export function SpecTestsPage() {
    const [tests, setTests] = useState<SpecTest[]>([])
    const [groups, setGroups] = useState<SpecTestGroup[]>([])
    const [selectedGroup, setSelectedGroup] = useState('default')
    const [loading, setLoading] = useState(true)

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create')
    const [editingTest, setEditingTest] = useState<SpecTest | null>(null)

    // Group editor state
    const [groupEditorOpen, setGroupEditorOpen] = useState(false)
    const [editingGroup, setEditingGroup] = useState<SpecTestGroup | null>(null)

    // Prompt modal
    const [promptText, setPromptText] = useState('')
    const [showPromptModal, setShowPromptModal] = useState(false)
    const [generatingPrompt, setGeneratingPrompt] = useState<string | null>(null)

    // Load data
    useEffect(() => {
        Promise.all([
            window.specTestsApi.load(),
            window.specTestsApi.loadGroups(),
        ]).then(([loadedTests, loadedGroups]) => {
            setTests(loadedTests || [])
            setGroups(loadedGroups || [{ key: 'default', name: 'Default', preconditions: '' }])
            setLoading(false)
        })
    }, [])

    // Collect selected group + all descendant group keys
    const filteredTests = useMemo(() => {
        const descendantKeys = new Set<string>([selectedGroup])
        // BFS to find all descendants
        const queue = [selectedGroup]
        while (queue.length > 0) {
            const current = queue.shift()!
            for (const g of groups) {
                if (g.parentKey === current && !descendantKeys.has(g.key)) {
                    descendantKeys.add(g.key)
                    queue.push(g.key)
                }
            }
        }
        return tests.filter((t) => descendantKeys.has(t.group))
    }, [tests, groups, selectedGroup])

    // Group name lookup map
    const groupNameMap = useMemo(() => {
        const map = new Map<string, string>()
        for (const g of groups) map.set(g.key, g.name)
        return map
    }, [groups])

    const handleSaveTest = useCallback((st: SpecTest) => {
        let updated: SpecTest[]
        if (drawerMode === 'edit') {
            updated = tests.map((t) => (t.id === st.id ? st : t))
        } else {
            updated = [...tests, st]
        }
        setTests(updated)
        window.specTestsApi.save(updated)
        setDrawerOpen(false)
        setEditingTest(null)
        message.success(drawerMode === 'edit' ? 'Spec test updated' : `Spec test created: ${st.title}`)
    }, [tests, drawerMode])

    const handleDeleteTest = useCallback((id: string) => {
        const updated = tests.filter((t) => t.id !== id)
        setTests(updated)
        window.specTestsApi.save(updated)
    }, [tests])

    const handleEditTest = useCallback((st: SpecTest) => {
        setEditingTest(st)
        setDrawerMode('edit')
        setDrawerOpen(true)
    }, [])

    const handleNewTest = useCallback(() => {
        setEditingTest(null)
        setDrawerMode('create')
        setDrawerOpen(true)
    }, [])

    // Group operations
    const handleSaveGroup = useCallback((g: SpecTestGroup) => {
        let updated: SpecTestGroup[]
        if (editingGroup) {
            updated = groups.map((gp) => (gp.key === g.key ? g : gp))
        } else {
            updated = [...groups, g]
        }
        setGroups(updated)
        window.specTestsApi.saveGroups(updated)
        setGroupEditorOpen(false)
        setEditingGroup(null)
        if (!editingGroup) setSelectedGroup(g.key)
    }, [groups, editingGroup])

    const handleDeleteGroup = useCallback((key: string) => {
        if (key === 'default') return
        const deletedGroup = groups.find((g) => g.key === key)
        const parentOfDeleted = deletedGroup?.parentKey || 'default'

        // Move tests from deleted group to its parent
        const updatedTests = tests.map((t) =>
            t.group === key ? { ...t, group: parentOfDeleted } : t
        )
        setTests(updatedTests)
        window.specTestsApi.save(updatedTests)

        // Re-parent child groups to deleted group's parent
        const updatedGroups = groups
            .filter((g) => g.key !== key)
            .map((g) => g.parentKey === key ? { ...g, parentKey: deletedGroup?.parentKey } : g)
        setGroups(updatedGroups)
        window.specTestsApi.saveGroups(updatedGroups)

        if (selectedGroup === key) setSelectedGroup(parentOfDeleted)
    }, [tests, groups, selectedGroup])

    const handleGeneratePrompt = useCallback(async (st: SpecTest) => {
        setGeneratingPrompt(st.id)
        try {
            const snippets: string[] = []
            for (const unit of st.units) {
                const { filePath, keyword } = parsePath(unit.path)
                const units = await window.specTestsApi.lookupUnit(filePath, keyword)
                if (units.length > 0) {
                    const u = units[0]
                    try {
                        const src = await window.codescanApi.getFileSource(u.filePath)
                        if (src) {
                            const lines = src.split('\n')
                            snippets.push(`### ${u.type} \`${u.name}\` (${u.filePath})\n\`\`\`typescript\n${lines.slice(u.startLine - 1, u.endLine).join('\n')}\n\`\`\``)
                        }
                    } catch { /* ignore */ }
                }
            }

            // Build full ancestor precondition chain (root → ... → current group)
            const groupMap = new Map(groups.map((g) => [g.key, g]))
            const preconditionChain: { name: string; preconditions: string }[] = []
            let walkKey: string | undefined = st.group
            while (walkKey) {
                const g = groupMap.get(walkKey)
                if (!g) break
                if (g.preconditions?.trim()) {
                    preconditionChain.unshift({ name: g.name, preconditions: g.preconditions.trim() })
                }
                walkKey = g.parentKey
            }

            const preconditionSection = preconditionChain.length > 0
                ? `\n### Group Preconditions\n\nThe following preconditions are inherited from the group hierarchy (from root to current). All test cases **MUST** comply with these preconditions:\n\n${preconditionChain.map((p) => `#### ${p.name}\n${p.preconditions}`).join('\n\n')}\n`
                : ''

            const requirementsSection = st.description?.trim()
                ? `\n### Test Requirements\n${st.description.trim()}\n`
                : ''

            const groupPath = (() => {
                const path: string[] = []
                let k: string | undefined = st.group
                while (k) {
                    const g = groupMap.get(k)
                    if (!g) break
                    path.unshift(g.name)
                    k = g.parentKey
                }
                return path.join(' › ')
            })()

            const prompt = `## Spec Test Generation

Please write a spec/integration test that verifies the collaborative behavior of the following syntax units.

### Test Metadata
- **Test ID**: \`${st.id}\`
- **Title**: ${st.title}
- **Group**: ${groupPath}
${preconditionSection}${requirementsSection}
### Referenced Syntax Units

${snippets.join('\n\n')}

### Instructions
1. Use \`@playwright/test\` as the test framework (\`test\`, \`expect\`, \`Page\`).  
   If the project has not yet configured \`@playwright/test\`, initialize the environment first:
   \`\`\`bash
   pnpm add -D @playwright/test
   npx playwright install
   \`\`\`
2. The test file should be placed in the \`tests/\` directory located at the same level as the nearest \`tsconfig.json\` relative to the source file being tested.
3. The \`test.describe\` block description **MUST** use the format: \`[${st.id}] ${st.title}\`
4. All test cases must comply with the **Group Preconditions** defined above (if any). Abstract reusable setup logic (e.g. login, database initialization) into shared fixtures or helper functions.
5. Test the **collaborative behavior** between the listed syntax units.
6. Mock external dependencies as needed.
7. Cover edge cases and error handling.
8. Do **NOT** write the test code immediately. First propose the test logic and cases, then wait for user confirmation.
`
            setPromptText(prompt)
            setShowPromptModal(true)
        } catch {
            message.error('Failed to generate prompt')
        }
        setGeneratingPrompt(null)
    }, [groups])

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            width: '25%',
            render: (t: string) => <Text strong style={{ fontSize: 13 }}>{t}</Text>,
        },
        {
            title: 'Group',
            key: 'group',
            width: '15%',
            render: (_: unknown, record: SpecTest) => (
                <Tag style={{ fontSize: 11 }}>{groupNameMap.get(record.group) || record.group}</Tag>
            ),
        },
        {
            title: 'Requirements',
            dataIndex: 'description',
            key: 'description',
            width: '35%',
            ellipsis: true,
        },
        {
            title: 'Action',
            key: 'action',
            width: '20%',
            render: (_: unknown, record: SpecTest) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<ThunderboltOutlined />}
                        size="small"
                        loading={generatingPrompt === record.id}
                        onClick={() => handleGeneratePrompt(record)}
                        title="Generate test prompt"
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEditTest(record)}
                    />
                    <Popconfirm
                        title="Delete this spec test?"
                        onConfirm={() => handleDeleteTest(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Spin size="large" />
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', height: '100%' }}>
            {/* Left: Groups Sidebar */}
            <div
                style={{
                    width: 260,
                    flexShrink: 0,
                    borderRight: '1px solid var(--ant-color-border)',
                    padding: '16px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 13 }}>Groups</Text>
                    <Button
                        type="text"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => { setEditingGroup(null); setGroupEditorOpen(true) }}
                    />
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <Tree
                        className="spec-group-tree"
                        defaultExpandAll
                        selectedKeys={[selectedGroup]}
                        onSelect={(keys) => {
                            if (keys.length > 0) setSelectedGroup(keys[0] as string)
                        }}
                        treeData={buildGroupTree(
                            groups,
                            selectedGroup,
                            (key) => setSelectedGroup(key),
                            (g) => { setEditingGroup(g); setGroupEditorOpen(true) },
                            (key) => handleDeleteGroup(key),
                        )}
                    />
                </div>
            </div>

            {/* Right: Test List */}
            <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 16,
                    }}
                >
                    <div>
                        <Title level={4} style={{ margin: 0 }}>
                            {groups.find((g) => g.key === selectedGroup)?.name || 'Spec Tests'}
                        </Title>
                        {groups.find((g) => g.key === selectedGroup)?.preconditions && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Preconditions: {groups.find((g) => g.key === selectedGroup)?.preconditions}
                            </Text>
                        )}
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleNewTest}
                    >
                        New Spec Test
                    </Button>
                </div>

                {/* Table */}
                {filteredTests.length > 0 ? (
                    <Table
                        dataSource={filteredTests}
                        columns={columns}
                        rowKey="id"
                        size="small"
                        pagination={false}
                    />
                ) : (
                    <Empty
                        description="No spec tests in this group. Click 'New Spec Test' to create one."
                        style={{ marginTop: 80 }}
                    />
                )}
            </div>

            {/* Drawer — Create / Edit */}
            <SpecTestDrawer
                open={drawerOpen}
                onCancel={() => { setDrawerOpen(false); setEditingTest(null) }}
                onSave={handleSaveTest}
                mode={drawerMode}
                editingTest={editingTest}
                groups={groups}
                selectedGroup={selectedGroup}
            />

            {/* Group Editor Modal */}
            <GroupEditorDrawer
                open={groupEditorOpen}
                group={editingGroup}
                groups={groups}
                onCancel={() => { setGroupEditorOpen(false); setEditingGroup(null) }}
                onSave={handleSaveGroup}
            />

            {/* Prompt Drawer */}
            <Drawer
                title="Generated Spec Test Prompt"
                open={showPromptModal}
                onClose={() => setShowPromptModal(false)}
                width={680}
                footer={
                    <div style={{ textAlign: 'right' }}>
                        <Button
                            type="primary"
                            onClick={() => {
                                const custom = (document.getElementById('spec-custom-prompt') as HTMLTextAreaElement)?.value?.trim()
                                const full = custom ? `${promptText}\n\n${custom}` : promptText
                                navigator.clipboard.writeText(full)
                                message.success('Prompt copied to clipboard')
                            }}
                        >
                            Copy Prompt
                        </Button>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                            Generated Prompt
                        </Text>
                        <MarkdownViewer
                            content={promptText}
                            style={{
                                background: 'var(--ant-color-bg-layout)',
                                borderRadius: 8,
                                padding: 16,
                                overflow: 'auto',
                                border: '1px solid var(--ant-color-border)',
                            }}
                        />
                    </div>
                    <div>
                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                            Additional Instructions (optional)
                        </Text>
                        <TextArea
                            id="spec-custom-prompt"
                            placeholder="Add extra instructions here, e.g. specific edge cases, constraints..."
                            rows={1}
                            style={{ fontSize: 13 }}
                        />
                    </div>
                </div>
            </Drawer>
        </div>
    )
}
