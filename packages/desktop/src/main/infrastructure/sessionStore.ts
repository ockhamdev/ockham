import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const SESSION_FILE = path.join(os.homedir(), '.ockham', 'session.json')

export interface StoredSession {
    token: string
    userId: string
    userName: string
    email: string
}

/** In-memory session cache — always up-to-date even if file write fails */
let memorySession: StoredSession | null = null

/**
 * Save session credentials to ~/.ockham/session.json AND in-memory cache.
 */
export function saveSession(session: StoredSession): void {
    memorySession = session
    try {
        const dir = path.dirname(SESSION_FILE)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), 'utf-8')
    } catch (err) {
        console.warn('[SessionStore] Failed to write session file:', err)
    }
}

/**
 * Load stored session. Prefers in-memory cache, falls back to file.
 */
export function loadSession(): StoredSession | null {
    if (memorySession) return memorySession
    try {
        if (fs.existsSync(SESSION_FILE)) {
            memorySession = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'))
            return memorySession
        }
    } catch {
        // corrupted file — treat as no session
    }
    return null
}

/**
 * Clear stored session (memory + file).
 */
export function clearSession(): void {
    memorySession = null
    try {
        if (fs.existsSync(SESSION_FILE)) {
            fs.unlinkSync(SESSION_FILE)
        }
    } catch {
        // ignore
    }
}
