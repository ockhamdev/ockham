// Types
export type { Note, AppConfig } from './types'

// IPC
export { IPC } from './ipc/channels'
export type { IPCChannel } from './ipc/channels'
export type { AddNotePayload, UpdateNotePayload } from './ipc/payloads'
export type { WorkspaceAPI, NotesAPI } from './ipc/api'
