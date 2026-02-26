import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC } from '@ockham/shared'
import { windowManager } from '../windowManager'
import {
    setLastWorkspace,
    addRecentWorkspace,
    getRecentWorkspaces,
    removeRecentWorkspace,
} from '../infrastructure/appConfig'

/**
 * Register workspace-related IPC handlers.
 */
export function registerWorkspaceHandlers(): void {
    /**
     * Open a workspace: shows folder dialog if no path provided,
     * updates config and window binding.
     */
    ipcMain.handle(
        IPC.WORKSPACE_OPEN,
        async (event, workspacePath?: string): Promise<string | null> => {
            let selectedPath = workspacePath

            if (!selectedPath) {
                const win = BrowserWindow.fromWebContents(event.sender)
                if (!win) return null

                const result = await dialog.showOpenDialog(win, {
                    properties: ['openDirectory'],
                    title: 'Open Workspace',
                })

                if (result.canceled || result.filePaths.length === 0) {
                    return null
                }
                selectedPath = result.filePaths[0]
            }

            // Update window binding
            windowManager.setWorkspace(event.sender.id, selectedPath)

            // Update config
            setLastWorkspace(selectedPath)
            addRecentWorkspace(selectedPath)

            return selectedPath
        }
    )

    /**
     * Open a workspace in a new window.
     */
    ipcMain.handle(
        IPC.WORKSPACE_OPEN_IN_NEW_WINDOW,
        async (_event, workspacePath?: string): Promise<void> => {
            let selectedPath = workspacePath

            if (!selectedPath) {
                const result = await dialog.showOpenDialog({
                    properties: ['openDirectory'],
                    title: 'Open Workspace in New Window',
                })

                if (result.canceled || result.filePaths.length === 0) {
                    return
                }
                selectedPath = result.filePaths[0]
            }

            windowManager.createWindow(selectedPath)
            setLastWorkspace(selectedPath)
            addRecentWorkspace(selectedPath)
        }
    )

    /**
     * Get the current workspace for this window.
     */
    ipcMain.handle(
        IPC.WORKSPACE_GET_CURRENT,
        (event): string | null => {
            return windowManager.getWorkspace(event.sender.id) || null
        }
    )

    /**
     * Get recent workspaces list.
     */
    ipcMain.handle(IPC.WORKSPACE_GET_RECENT, (): string[] => {
        return getRecentWorkspaces()
    })

    /**
     * Remove a workspace from recent list.
     */
    ipcMain.handle(
        IPC.WORKSPACE_REMOVE_RECENT,
        (_event, workspacePath: string): void => {
            removeRecentWorkspace(workspacePath)
        }
    )
}
