import { useState, useEffect, useCallback } from 'react'

export function useWorkspace() {
    const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null)
    const [recentWorkspaces, setRecentWorkspaces] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    /** Load initial state: current workspace + recent list */
    const init = useCallback(async () => {
        try {
            const [current, recent] = await Promise.all([
                window.workspaceApi.getCurrent(),
                window.workspaceApi.getRecent(),
            ])
            setCurrentWorkspace(current)
            setRecentWorkspaces(recent)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        init()
    }, [init])

    /** Open a workspace (with optional path, otherwise shows dialog) */
    const openWorkspace = useCallback(async (path?: string) => {
        const result = await window.workspaceApi.openWorkspace(path)
        if (result) {
            setCurrentWorkspace(result)
            // Refresh recent list
            const recent = await window.workspaceApi.getRecent()
            setRecentWorkspaces(recent)
        }
        return result
    }, [])

    /** Open a workspace in a new window */
    const openInNewWindow = useCallback(async (path?: string) => {
        await window.workspaceApi.openInNewWindow(path)
    }, [])

    /** Remove a workspace from the recent list */
    const removeRecent = useCallback(async (path: string) => {
        await window.workspaceApi.removeRecent(path)
        setRecentWorkspaces((prev) => prev.filter((p) => p !== path))
    }, [])

    return {
        currentWorkspace,
        recentWorkspaces,
        loading,
        openWorkspace,
        openInNewWindow,
        removeRecent,
    }
}
