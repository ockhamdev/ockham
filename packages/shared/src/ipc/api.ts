import type { Note } from '../types'
import type { AddNotePayload, UpdateNotePayload } from './payloads'

/**
 * WorkspaceAPI — exposed to renderer via contextBridge.
 */
export interface WorkspaceAPI {
    /** Open a workspace folder (shows dialog if no path provided) */
    openWorkspace(path?: string): Promise<string | null>
    /** Open a workspace in a new window */
    openInNewWindow(path?: string): Promise<void>
    /** Get current workspace path for this window */
    getCurrent(): Promise<string | null>
    /** Get recent workspace list (filtered for existence) */
    getRecent(): Promise<string[]>
    /** Remove a path from recent workspaces */
    removeRecent(path: string): Promise<void>
}

/**
 * NotesAPI — exposed to renderer via contextBridge.
 */
export interface NotesAPI {
    loadNotes(): Promise<Note[]>
    addNote(payload: AddNotePayload): Promise<Note>
    updateNote(payload: UpdateNotePayload): Promise<Note>
    deleteNote(id: string): Promise<void>
}
