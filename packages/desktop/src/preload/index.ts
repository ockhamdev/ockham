import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@ockham/shared'
import type { WorkspaceAPI, NotesAPI, CodeScanAPI, StoryAPI, AiConfigAPI, TestsAPI, SpecTestsAPI } from '@ockham/shared'
import type { AddNotePayload, UpdateNotePayload, StoryMessage, AiConfig, TestCase, SpecTest, SpecTestGroup } from '@ockham/shared'

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

/**
 * CodeScan API — exposed as window.codescanApi
 */
const codescanApi: CodeScanAPI = {
    runScan: () => ipcRenderer.invoke(IPC.CODESCAN_RUN),
    getResult: () => ipcRenderer.invoke(IPC.CODESCAN_GET_RESULT),
    getFileSource: (relativePath: string) =>
        ipcRenderer.invoke(IPC.CODESCAN_GET_FILE_SOURCE, relativePath),
}

/**
 * Story API — exposed as window.storyApi
 */
const storyApi: StoryAPI = {
    chat: (messages: StoryMessage[]) =>
        ipcRenderer.invoke(IPC.STORY_CHAT, messages),
    load: () => ipcRenderer.invoke(IPC.STORY_LOAD),
    save: (items: unknown[]) => ipcRenderer.invoke(IPC.STORY_SAVE, items),
}

/**
 * AI Config API — exposed as window.aiConfigApi
 */
const aiConfigApi: AiConfigAPI = {
    getConfig: () => ipcRenderer.invoke(IPC.AI_GET_CONFIG),
    setConfig: (config: AiConfig) =>
        ipcRenderer.invoke(IPC.AI_SET_CONFIG, config),
}

/**
 * Tests API — exposed as window.testsApi
 */
const testsApi: TestsAPI = {
    load: () => ipcRenderer.invoke(IPC.TESTS_LOAD),
    save: (items: TestCase[]) => ipcRenderer.invoke(IPC.TESTS_SAVE, items),
    lookupUnit: (filePath: string, keyword: string) =>
        ipcRenderer.invoke(IPC.TESTS_LOOKUP_UNIT, filePath, keyword),
    sync: (testIds: string[]) => ipcRenderer.invoke(IPC.TESTS_SYNC, testIds),
}

/**
 * Spec Tests API — exposed as window.specTestsApi
 */
const specTestsApi: SpecTestsAPI = {
    load: () => ipcRenderer.invoke(IPC.SPEC_TESTS_LOAD),
    save: (items: SpecTest[]) => ipcRenderer.invoke(IPC.SPEC_TESTS_SAVE, items),
    lookupUnit: (filePath: string, keyword: string) =>
        ipcRenderer.invoke(IPC.SPEC_TESTS_LOOKUP_UNIT, filePath, keyword),
    loadGroups: () => ipcRenderer.invoke(IPC.SPEC_TESTS_LOAD_GROUPS),
    saveGroups: (groups: SpecTestGroup[]) => ipcRenderer.invoke(IPC.SPEC_TESTS_SAVE_GROUPS, groups),
}

// Expose typed APIs to renderer
contextBridge.exposeInMainWorld('workspaceApi', workspaceApi)
contextBridge.exposeInMainWorld('notesApi', notesApi)
contextBridge.exposeInMainWorld('codescanApi', codescanApi)
contextBridge.exposeInMainWorld('storyApi', storyApi)
contextBridge.exposeInMainWorld('aiConfigApi', aiConfigApi)
contextBridge.exposeInMainWorld('testsApi', testsApi)
contextBridge.exposeInMainWorld('specTestsApi', specTestsApi)
