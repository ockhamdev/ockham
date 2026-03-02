import { ipcMain } from 'electron'
import { IPC } from '@ockham/shared'
import { windowManager } from '../windowManager'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export interface GitStatusInfo {
    branch: string
    commit: string
    commitShort: string
    changedFiles: number
    dirty: boolean
    /** commit short hash + '-latest' if dirty */
    version: string
}

async function git(cwd: string, ...args: string[]): Promise<string> {
    const { stdout } = await execFileAsync('git', args, { cwd, timeout: 5000 })
    return stdout.trim()
}

export function registerGitHandlers(): void {
    ipcMain.handle(IPC.GIT_STATUS, async (event): Promise<GitStatusInfo | null> => {
        const ws = windowManager.getWorkspace(event.sender.id)
        if (!ws) return null

        try {
            const [branch, commit, statusOutput] = await Promise.all([
                git(ws, 'rev-parse', '--abbrev-ref', 'HEAD'),
                git(ws, 'rev-parse', 'HEAD'),
                git(ws, 'status', '--porcelain'),
            ])

            const changedFiles = statusOutput ? statusOutput.split('\n').filter(Boolean).length : 0
            const dirty = changedFiles > 0
            const commitShort = commit.substring(0, 7)
            const version = dirty ? `${commitShort}-latest` : commitShort

            return {
                branch,
                commit,
                commitShort,
                changedFiles,
                dirty,
                version,
            }
        } catch {
            return null
        }
    })

    ipcMain.handle(IPC.GIT_REMOTE_ORIGIN, async (_event, workspacePath: string): Promise<string | null> => {
        if (!workspacePath) return null
        try {
            return await git(workspacePath, 'remote', 'get-url', 'origin')
        } catch {
            return null
        }
    })
}
