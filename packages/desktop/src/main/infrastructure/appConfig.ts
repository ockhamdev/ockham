import fs from 'fs'
import path from 'path'
import os from 'os'
import type { AppConfig } from '@ockham/shared'

const CONFIG_DIR = path.join(os.homedir(), '.ockham')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')
const MAX_RECENT = 10

/**
 * Ensures the config directory and file exist.
 */
function ensureConfigFile(): void {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true })
    }
    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({}, null, 2), 'utf-8')
    }
}

/**
 * Read the global app config.
 */
export function getConfig(): AppConfig {
    ensureConfigFile()
    try {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8')
        return JSON.parse(raw) as AppConfig
    } catch {
        return {}
    }
}

/**
 * Write the global app config.
 */
function saveConfig(config: AppConfig): void {
    ensureConfigFile()
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

/**
 * Set the last opened workspace path.
 */
export function setLastWorkspace(workspacePath: string): void {
    const config = getConfig()
    config.lastWorkspace = workspacePath
    saveConfig(config)
}

/**
 * Add a workspace to the recent list (unshift, dedup, cap at MAX_RECENT).
 */
export function addRecentWorkspace(workspacePath: string): void {
    const config = getConfig()
    let recent = config.recentWorkspaces || []
    // Remove duplicates
    recent = recent.filter((p) => p !== workspacePath)
    // Prepend
    recent.unshift(workspacePath)
    // Cap
    recent = recent.slice(0, MAX_RECENT)
    config.recentWorkspaces = recent
    saveConfig(config)
}

/**
 * Remove a workspace from the recent list.
 */
export function removeRecentWorkspace(workspacePath: string): void {
    const config = getConfig()
    config.recentWorkspaces = (config.recentWorkspaces || []).filter(
        (p) => p !== workspacePath
    )
    saveConfig(config)
}

/**
 * Get recent workspaces, filtering out non-existent paths.
 */
export function getRecentWorkspaces(): string[] {
    const config = getConfig()
    const recent = config.recentWorkspaces || []
    return recent.filter((p) => fs.existsSync(p))
}
