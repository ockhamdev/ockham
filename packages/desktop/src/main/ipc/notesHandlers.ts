import { ipcMain } from 'electron'
import { IPC } from '@ockham/shared'
import type { Note, AddNotePayload, UpdateNotePayload } from '@ockham/shared'
import { windowManager } from '../windowManager'
import * as notesStore from '../infrastructure/notesStore'

/**
 * Register Notes IPC handlers.
 * All operations are scoped to the workspace of the calling window.
 */
export function registerNotesHandlers(): void {
    ipcMain.handle(IPC.NOTES_LOAD, (event): Note[] => {
        const workspace = windowManager.getWorkspace(event.sender.id)
        if (!workspace) return []
        return notesStore.loadNotes(workspace)
    })

    ipcMain.handle(
        IPC.NOTES_ADD,
        (event, payload: AddNotePayload): Note | null => {
            const workspace = windowManager.getWorkspace(event.sender.id)
            if (!workspace) throw new Error('No workspace bound to this window')
            return notesStore.addNote(workspace, payload)
        }
    )

    ipcMain.handle(
        IPC.NOTES_UPDATE,
        (event, payload: UpdateNotePayload): Note | null => {
            const workspace = windowManager.getWorkspace(event.sender.id)
            if (!workspace) throw new Error('No workspace bound to this window')
            return notesStore.updateNote(workspace, payload)
        }
    )

    ipcMain.handle(IPC.NOTES_DELETE, (event, id: string): void => {
        const workspace = windowManager.getWorkspace(event.sender.id)
        if (!workspace) throw new Error('No workspace bound to this window')
        notesStore.deleteNote(workspace, id)
    })
}
