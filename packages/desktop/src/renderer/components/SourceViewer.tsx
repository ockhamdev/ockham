import React, { useMemo, useRef, useEffect } from 'react'
import '../styles/hljs-theme.css'
import hljs from 'highlight.js/lib/core'

// Register common languages
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import css from 'highlight.js/lib/languages/css'
import scss from 'highlight.js/lib/languages/scss'
import less from 'highlight.js/lib/languages/less'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'

hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('css', css)
hljs.registerLanguage('scss', scss)
hljs.registerLanguage('less', less)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('json', json)
// TSX / JSX map to typescript / javascript
hljs.registerLanguage('typescriptreact', typescript)
hljs.registerLanguage('tsx', typescript)
hljs.registerLanguage('jsx', javascript)

// Map file extensions to hljs language names
function detectLanguage(filePath: string): string | undefined {
    const ext = filePath.split('.').pop()?.toLowerCase()
    const map: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        mjs: 'javascript',
        cjs: 'javascript',
        css: 'css',
        scss: 'scss',
        less: 'less',
        html: 'html',
        htm: 'html',
        json: 'json',
        vue: 'html',
        svg: 'html',
    }
    return ext ? map[ext] : undefined
}

interface SourceViewerProps {
    /** Full file source code */
    source: string
    /** File path (used for language detection) */
    filePath: string
    /** Lines to highlight (startLine..endLine, 1-indexed inclusive) */
    highlightStart?: number
    highlightEnd?: number
    /** Style overrides for container */
    style?: React.CSSProperties
}

/**
 * Source code viewer with line numbers, syntax highlighting, and line-range highlighting.
 */
export function SourceViewer({
    source,
    filePath,
    highlightStart,
    highlightEnd,
    style,
}: SourceViewerProps) {
    const highlightRef = useRef<HTMLTableRowElement>(null)

    // Highlight the source code
    const highlightedLines = useMemo(() => {
        const lang = detectLanguage(filePath)

        const rawLines = source.split('\n')
        return rawLines.map((line) => {
            try {
                if (lang) {
                    return hljs.highlight(line, { language: lang }).value
                }
                return hljs.highlightAuto(line).value
            } catch {
                return line
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
            }
        })
    }, [source, filePath])

    // Scroll highlighted area into view
    useEffect(() => {
        if (highlightStart && highlightRef.current) {
            setTimeout(() => {
                highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
        }
    }, [highlightStart, highlightedLines])

    return (
        <div
            className="hljs"
            style={{
                overflow: 'auto',
                fontFamily: "'Menlo', 'Monaco', 'Consolas', 'Courier New', monospace",
                fontSize: 13,
                lineHeight: 1.6,
                padding: 0,
                ...style,
            }}
        >
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <tbody>
                    {highlightedLines.map((lineHtml, idx) => {
                        const lineNum = idx + 1
                        const isHighlighted =
                            highlightStart != null &&
                            highlightEnd != null &&
                            lineNum >= highlightStart &&
                            lineNum <= highlightEnd
                        return (
                            <tr
                                key={lineNum}
                                ref={lineNum === highlightStart ? highlightRef : undefined}
                                style={{
                                    background: isHighlighted
                                        ? 'rgba(22, 119, 255, 0.12)'
                                        : 'transparent',
                                }}
                            >
                                <td
                                    style={{
                                        padding: '0 12px 0 16px',
                                        textAlign: 'right',
                                        color: 'var(--ant-color-text-quaternary)',
                                        userSelect: 'none',
                                        whiteSpace: 'nowrap',
                                        fontSize: 12,
                                        width: 1,
                                        borderRight: isHighlighted
                                            ? '3px solid var(--ant-color-primary)'
                                            : '3px solid transparent',
                                    }}
                                >
                                    {lineNum}
                                </td>
                                <td
                                    style={{
                                        padding: '0 16px',
                                        whiteSpace: 'pre',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: lineHtml }}
                                />
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
