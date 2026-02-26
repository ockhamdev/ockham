import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@ockham/shared'
import type { WorkspaceAPI, NotesAPI } from '@ockham/shared'
import type { AddNotePayload, UpdateNotePayload } from '@ockham/shared'

/**
 * Workspace API — exposed as window.workspaceApi
 */
const workspaceApi: WorkspaceAPI = {
    openWorkspace: (path?: string) =>
        ipcRenderer.invoke(IPC.WORKSPACE_OPEN, path),
    openInNewWindow: (path?: string) =>
        ipcRenderer.invoke(IPC.WORKSPACE_OPEN_IN_NEW_WINDOW, path),
    getCurrent: () => ipcRenderer.invoke(IPC.WORKSPACE_GET_CURRENT),
    getRecent: () => ipcRenderer.invoke(IPC.WORKSPACE_GET_RECENT),
    removeRecent: (path: string) =>
        ipcRenderer.invoke(IPC.WORKSPACE_REMOVE_RECENT, path),
}

/**
 * Notes API — exposed as window.notesApi
 */
const notesApi: NotesAPI = {
    loadNotes: () => ipcRenderer.invoke(IPC.NOTES_LOAD),
    addNote: (payload: AddNotePayload) =>
        ipcRenderer.invoke(IPC.NOTES_ADD, payload),
    updateNote: (payload: UpdateNotePayload) =>
        ipcRenderer.invoke(IPC.NOTES_UPDATE, payload),
    deleteNote: (id: string) => ipcRenderer.invoke(IPC.NOTES_DELETE, id),
}

// Expose typed APIs to renderer
contextBridge.exposeInMainWorld('workspaceApi', workspaceApi)
contextBridge.exposeInMainWorld('notesApi', notesApi)
