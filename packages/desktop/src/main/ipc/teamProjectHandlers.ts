import { ipcMain } from 'electron'
import { IPC } from '@ockham/shared'
import { trpcQuery, trpcMutation } from '../infrastructure/apiClient'
import { loadSession } from '../infrastructure/sessionStore'

/**
 * Helper: get token from session store.
 */
function getToken(): string | undefined {
    return loadSession()?.token
}

/**
 * Register Team & Project IPC handlers.
 * Proxies tRPC calls to the Web API.
 */
export function registerTeamProjectHandlers(): void {
    // ── Team ──

    ipcMain.handle(IPC.TEAM_LIST, async () => {
        try {
            return await trpcQuery('team.list', undefined, getToken())
        } catch {
            return []
        }
    })

    ipcMain.handle(IPC.TEAM_ENSURE, async () => {
        return trpcQuery('team.ensureTeam', undefined, getToken())
    })

    // ── Project ──

    ipcMain.handle(IPC.PROJECT_ENSURE, async (_event, teamId: string, slug: string, name: string) => {
        return trpcMutation('project.ensureBySlug', { teamId, slug, name }, getToken())
    })

    // ── Team AI Config ──

    ipcMain.handle(IPC.TEAM_AI_CONFIG_LIST, async (_event, teamId: string) => {
        return trpcQuery('teamAiConfig.list', { teamId }, getToken())
    })

    ipcMain.handle(IPC.TEAM_AI_CONFIG_UPSERT, async (_event, data: {
        id?: string; teamId: string; provider: string; apiKey: string
        baseUrl?: string; models?: string[]; isDefault?: boolean
    }) => {
        return trpcMutation('teamAiConfig.upsert', data, getToken())
    })

    ipcMain.handle(IPC.TEAM_AI_CONFIG_DELETE, async (_event, id: string) => {
        return trpcMutation('teamAiConfig.delete', { id }, getToken())
    })
}
