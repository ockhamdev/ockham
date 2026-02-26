/**
 * IPC Payload types for each operation.
 */

export interface AddNotePayload {
    title: string
    content: string
}

export interface UpdateNotePayload {
    id: string
    title?: string
    content?: string
}
