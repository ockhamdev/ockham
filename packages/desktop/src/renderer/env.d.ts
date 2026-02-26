import type { WorkspaceAPI, NotesAPI } from '@ockham/shared'

declare global {
    interface Window {
        workspaceApi: WorkspaceAPI
        notesApi: NotesAPI
    }
}
