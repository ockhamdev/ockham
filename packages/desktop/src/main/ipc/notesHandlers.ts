import { ipcMain } from 'electron'
import { IPC } from '@ockham/shared'
import type { Note, AddNotePayload, UpdateNotePayload } from '@ockham/shared'
import { trpcQuery, trpcMutation } from '../infrastructure/apiClient'

/**
 * Register Notes IPC handlers.
 * All operations call the Web backend via tRPC.
 */
export function registerNotesHandlers(): void {
    ipcMain.handle(IPC.NOTES_LOAD, async (_event, projectId: string): Promise<Note[]> => {
        return trpcQuery<Note[]>('note.list', { projectId })
    })

    ipcMain.handle(
        IPC.NOTES_ADD,
        async (_event, projectId: string, payload: AddNotePayload): Promise<Note | null> => {
            return trpcMutation<Note>('note.create', {
                projectId,
                title: payload.title,
                content: payload.content,
            })
        }
    )

    ipcMain.handle(
        IPC.NOTES_UPDATE,
        async (_event, payload: UpdateNotePayload): Promise<Note | null> => {
            return trpcMutation<Note>('note.update', payload)
        }
    )

    ipcMain.handle(IPC.NOTES_DELETE, async (_event, id: string): Promise<void> => {
        await trpcMutation('note.delete', { id })
    })
}
