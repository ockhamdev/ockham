/**
 * IPC channel constants — single source of truth for all IPC communication.
 */
export const IPC = {
    // Workspace
    WORKSPACE_OPEN: 'workspace:open',
    WORKSPACE_OPEN_IN_NEW_WINDOW: 'workspace:openInNewWindow',
    WORKSPACE_GET_CURRENT: 'workspace:getCurrent',
    WORKSPACE_GET_RECENT: 'workspace:getRecent',
    WORKSPACE_REMOVE_RECENT: 'workspace:removeRecent',

    // Notes
    NOTES_LOAD: 'notes:load',
    NOTES_ADD: 'notes:add',
    NOTES_UPDATE: 'notes:update',
    NOTES_DELETE: 'notes:delete',

    // CodeScan
    CODESCAN_RUN: 'codescan:run',
    CODESCAN_GET_RESULT: 'codescan:getResult',
    CODESCAN_GET_FILE_SOURCE: 'codescan:getFileSource',
} as const

export type IPCChannel = (typeof IPC)[keyof typeof IPC]
