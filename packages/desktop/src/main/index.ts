import { app, BrowserWindow, Menu, shell, dialog } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { windowManager } from './windowManager'
import { getConfig, getRecentWorkspaces, setLastWorkspace, addRecentWorkspace } from './infrastructure/appConfig'
import { registerWorkspaceHandlers } from './ipc/workspaceHandlers'
import { registerNotesHandlers } from './ipc/notesHandlers'
import { registerCodescanHandlers } from './ipc/codescanHandlers'
import { registerStoryHandlers } from './ipc/storyHandlers'
import { registerTestsHandlers } from './ipc/testsHandlers'
import { registerSpecTestsHandlers } from './ipc/specTestsHandlers'
import path from 'path'

/**
 * Build the macOS application menu.
 */
function buildAppMenu(): void {
    const recentWorkspaces = getRecentWorkspaces()

    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' },
            ],
        },
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Window',
                    accelerator: 'CmdOrCtrl+Shift+N',
                    click: () => {
                        windowManager.createWindow()
                    },
                },
                {
                    label: 'Open Workspace in New Window',
                    accelerator: 'CmdOrCtrl+Shift+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog({
                            properties: ['openDirectory'],
                            title: 'Open Workspace in New Window',
                        })
                        if (!result.canceled && result.filePaths.length > 0) {
                            const selectedPath = result.filePaths[0]
                            windowManager.createWindow(selectedPath)
                            setLastWorkspace(selectedPath)
                            addRecentWorkspace(selectedPath)
                            buildAppMenu() // Refresh recent list in menu
                        }
                    },
                },
                { type: 'separator' },
                {
                    label: 'Open Recent',
                    submenu:
                        recentWorkspaces.length > 0
                            ? recentWorkspaces.map((ws) => ({
                                label: `${path.basename(ws)} — ${ws}`,
                                click: () => {
                                    windowManager.createWindow(ws)
                                    buildAppMenu()
                                },
                            }))
                            : [{ label: 'No Recent Workspaces', enabled: false }],
                },
                { type: 'separator' },
                { role: 'close' as const },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' },
            ],
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { type: 'separator' },
                { role: 'front' },
            ],
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Learn More',
                    click: () => {
                        shell.openExternal('https://github.com/ockham')
                    },
                },
            ],
        },
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

/**
 * Build macOS Dock menu — "New Window" + recent workspaces.
 */
function buildDockMenu(): void {
    const recentWorkspaces = getRecentWorkspaces()

    const dockMenuItems: Electron.MenuItemConstructorOptions[] = [
        {
            label: 'New Window',
            click: () => {
                windowManager.createWindow()
            },
        },
    ]

    if (recentWorkspaces.length > 0) {
        dockMenuItems.push({ type: 'separator' })
        recentWorkspaces.forEach((ws) => {
            dockMenuItems.push({
                label: path.basename(ws),
                click: () => {
                    windowManager.createWindow(ws)
                },
            })
        })
    }

    app.dock?.setMenu(Menu.buildFromTemplate(dockMenuItems))
}

// ─── App Lifecycle ────────────────────────────────────────────────

app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.ockham.desktop')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // Register all IPC handlers
    registerWorkspaceHandlers()
    registerNotesHandlers()
    registerCodescanHandlers()
    registerStoryHandlers()
    registerTestsHandlers()
    registerSpecTestsHandlers()

    // Build menus
    buildAppMenu()
    buildDockMenu()

    // Restore last workspace or create empty window
    const config = getConfig()
    if (config.lastWorkspace) {
        windowManager.createWindow(config.lastWorkspace)
    } else {
        windowManager.createWindow()
    }

    app.on('activate', () => {
        // On macOS re-create a window when dock is clicked with no windows.
        if (BrowserWindow.getAllWindows().length === 0) {
            const cfg = getConfig()
            if (cfg.lastWorkspace) {
                windowManager.createWindow(cfg.lastWorkspace)
            } else {
                windowManager.createWindow()
            }
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
