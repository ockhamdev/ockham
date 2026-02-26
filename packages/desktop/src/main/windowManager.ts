import { BrowserWindow, screen } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'

/**
 * WindowManager — manages multiple windows and their workspace bindings.
 * Key: webContents.id → workspace path
 */
class WindowManager {
    private workspaceMap = new Map<number, string>()

    /**
     * Create a new BrowserWindow, optionally bound to a workspace.
     */
    createWindow(workspacePath?: string): BrowserWindow {
        const { width, height } = screen.getPrimaryDisplay().workAreaSize

        const win = new BrowserWindow({
            width: Math.min(1400, width),
            height: Math.min(900, height),
            minWidth: 800,
            minHeight: 600,
            show: false,
            titleBarStyle: 'hiddenInset',
            trafficLightPosition: { x: 16, y: 16 },
            webPreferences: {
                preload: path.join(__dirname, '../preload/index.js'),
                sandbox: false,
            },
        })

        win.on('ready-to-show', () => {
            win.show()
        })

        win.on('closed', () => {
            this.workspaceMap.delete(win.webContents.id)
        })

        if (workspacePath) {
            this.setWorkspace(win.webContents.id, workspacePath)
            win.setTitle(path.basename(workspacePath))
        } else {
            win.setTitle('Ockham')
        }

        // Load renderer
        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            win.loadURL(process.env['ELECTRON_RENDERER_URL'])
        } else {
            win.loadFile(path.join(__dirname, '../renderer/index.html'))
        }

        return win
    }

    /**
     * Bind a workspace path to a window's webContents ID.
     */
    setWorkspace(webContentsId: number, workspacePath: string): void {
        this.workspaceMap.set(webContentsId, workspacePath)
        const win = BrowserWindow.getAllWindows().find(
            (w) => w.webContents.id === webContentsId
        )
        if (win) {
            win.setTitle(path.basename(workspacePath))
        }
    }

    /**
     * Get the workspace path for a given webContents ID.
     */
    getWorkspace(webContentsId: number): string | undefined {
        return this.workspaceMap.get(webContentsId)
    }

    /**
     * Remove a window from the map.
     */
    removeWindow(webContentsId: number): void {
        this.workspaceMap.delete(webContentsId)
    }

    /**
     * Get all windows.
     */
    getAllWindows(): BrowserWindow[] {
        return BrowserWindow.getAllWindows()
    }
}

export const windowManager = new WindowManager()
