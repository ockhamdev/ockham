import { ipcMain } from 'electron'
import { IPC } from '@ockham/shared'
import { apiLogin, apiRegister, trpcQuery } from '../infrastructure/apiClient'
import { saveSession, loadSession, clearSession } from '../infrastructure/sessionStore'

/**
 * Register authentication IPC handlers.
 */
export function registerAuthHandlers(): void {
    ipcMain.handle(
        IPC.AUTH_LOGIN,
        async (_event, email: string, password: string) => {
            const { token, user } = await apiLogin(email, password)
            console.log('[AUTH] Login success, saving session to ~/.ockham/session.json', { userId: user.id, email: user.email })
            saveSession({
                token,
                userId: user.id,
                userName: user.name,
                email: user.email,
            })
            console.log('[AUTH] Session saved successfully')
            // Ensure user has a team (auto-create if needed)
            try {
                await trpcQuery('team.ensureTeam', undefined)
            } catch { /* non-blocking */ }
            return { token, userId: user.id, userName: user.name, email: user.email }
        }
    )

    ipcMain.handle(
        IPC.AUTH_REGISTER,
        async (_event, email: string, password: string) => {
            const { token, user } = await apiRegister(email, password)
            saveSession({
                token,
                userId: user.id,
                userName: user.name,
                email: user.email,
            })
            // Ensure user has a team (auto-create if needed)
            try {
                await trpcQuery('team.ensureTeam', undefined)
            } catch { /* non-blocking */ }
            return { token, userId: user.id, userName: user.name, email: user.email }
        }
    )

    ipcMain.handle(IPC.AUTH_LOGOUT, async () => {
        clearSession()
    })

    ipcMain.handle(IPC.AUTH_SYNC_SESSION, async (_event, data: { token: string; userId: string; userName: string; email: string }) => {
        saveSession(data)
    })

    ipcMain.handle(IPC.AUTH_GET_SESSION, async () => {
        const stored = loadSession()
        if (!stored?.token) return null

        // Verify with server
        try {
            const BASE_URL = process.env.OCKHAM_API_URL || 'http://localhost:7353'
            const res = await fetch(`${BASE_URL}/api/auth/get-session`, {
                headers: { cookie: `better-auth.session_token=${stored.token}` },
            })
            if (!res.ok) {
                clearSession()
                return null
            }
            const body = await res.json() as { session?: { userId?: string } }
            if (!body?.session?.userId) {
                clearSession()
                return null
            }
            return stored
        } catch {
            // Network error — return stored session (offline tolerance)
            return stored
        }
    })
}
