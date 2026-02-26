import type { WorkspaceAPI, NotesAPI, CodeScanAPI } from '@ockham/shared'

declare global {
    interface Window {
        workspaceApi: WorkspaceAPI
        notesApi: NotesAPI
        codescanApi: CodeScanAPI
    }
}
