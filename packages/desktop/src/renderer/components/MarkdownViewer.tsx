import React from 'react'
import Markdown from 'react-markdown'
import '../styles/markdown-viewer.css'

interface MarkdownViewerProps {
    /** Markdown source text */
    content: string
    /** Style overrides for container */
    style?: React.CSSProperties
}

/**
 * Renders markdown content with clean typography.
 * Uses react-markdown with custom CSS styling.
 */
export function MarkdownViewer({ content, style }: MarkdownViewerProps) {
    return (
        <div className="markdown-viewer" style={style}>
            <Markdown>{content}</Markdown>
        </div>
    )
}
