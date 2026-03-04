import React from 'react'
import { Typography, Tooltip, Button, message } from 'antd'

const { Text } = Typography

/**
 * Shared CopyableCell — shows value with tooltip containing full text + copy button.
 */
export function CopyableCell({ value, fontSize = 12 }: { value: string; fontSize?: number }) {
    return (
        <Tooltip
            title={
                <div style={{ maxWidth: 400, wordBreak: 'break-all' }}>
                    <div style={{ marginBottom: 6, fontFamily: 'monospace', fontSize: 12 }}>{value}</div>
                    <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                            navigator.clipboard.writeText(value)
                            message.success('Copied')
                        }}
                    >
                        Copy
                    </Button>
                </div>
            }
        >
            <Text
                code
                style={{
                    fontSize,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    maxWidth: '100%',
                    cursor: 'pointer',
                }}
            >
                {value}
            </Text>
        </Tooltip>
    )
}

/**
 * Parse "filePath keyword" path string into components.
 * e.g. "src/utils/helper.ts computeHash" => { filePath: "src/utils/helper.ts", keyword: "computeHash" }
 */
export function parsePath(p: string): { filePath: string; keyword: string } {
    const idx = p.indexOf(' ')
    if (idx === -1) return { filePath: p, keyword: '' }
    return { filePath: p.substring(0, idx), keyword: p.substring(idx + 1) }
}
