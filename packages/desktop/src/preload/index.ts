import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@ockham/shared'
import type { WorkspaceAPI, NotesAPI, CodeScanAPI, StoryAPI, AiConfigAPI, TestsAPI, SpecTestsAPI, AuthAPI, GitAPI, TeamAPI, ProjectAPI, TeamAiConfigAPI } from '@ockham/shared'
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
    loadNotes: (projectId: string) => ipcRenderer.invoke(IPC.NOTES_LOAD, projectId),
    addNote: (projectId: string, payload: AddNotePayload) =>
        ipcRenderer.invoke(IPC.NOTES_ADD, projectId, payload),
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
    load: (projectId: string) => ipcRenderer.invoke(IPC.STORY_LOAD, projectId),
    save: (items: unknown[]) => ipcRenderer.invoke(IPC.STORY_SAVE, items),
    addMessage: (storyId: string, role: string, content: string, order: number) =>
        ipcRenderer.invoke(IPC.STORY_ADD_MESSAGE, storyId, role, content, order),
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
    load: (projectId: string) => ipcRenderer.invoke(IPC.TESTS_LOAD, projectId),
    save: (projectId: string, items: TestCase[]) => ipcRenderer.invoke(IPC.TESTS_SAVE, projectId, items),
    lookupUnit: (filePath: string, keyword: string) =>
        ipcRenderer.invoke(IPC.TESTS_LOOKUP_UNIT, filePath, keyword),
    link: (testIds: string[]) => ipcRenderer.invoke(IPC.TESTS_LINK, testIds),
    readBlock: (filePath: string, line: number) => ipcRenderer.invoke(IPC.TESTS_READ_BLOCK, filePath, line),
}

/**
 * Spec Tests API — exposed as window.specTestsApi
 */
const specTestsApi: SpecTestsAPI = {
    load: (projectId: string) => ipcRenderer.invoke(IPC.SPEC_TESTS_LOAD, projectId),
    save: (projectId: string, items: SpecTest[]) => ipcRenderer.invoke(IPC.SPEC_TESTS_SAVE, projectId, items),
    lookupUnit: (filePath: string, keyword: string) =>
        ipcRenderer.invoke(IPC.SPEC_TESTS_LOOKUP_UNIT, filePath, keyword),
    loadGroups: (projectId: string) => ipcRenderer.invoke(IPC.SPEC_TESTS_LOAD_GROUPS, projectId),
    saveGroups: (projectId: string, groups: SpecTestGroup[]) => ipcRenderer.invoke(IPC.SPEC_TESTS_SAVE_GROUPS, projectId, groups),
    link: (testIds: string[]) => ipcRenderer.invoke(IPC.SPEC_TESTS_LINK, testIds),
    readBlock: (filePath: string, line: number) => ipcRenderer.invoke(IPC.SPEC_TESTS_READ_BLOCK, filePath, line),
}

/**
 * Auth API — exposed as window.authApi
 */
const authApi: AuthAPI = {
    login: (email: string, password: string) =>
        ipcRenderer.invoke(IPC.AUTH_LOGIN, email, password),
    register: (email: string, password: string) =>
        ipcRenderer.invoke(IPC.AUTH_REGISTER, email, password),
    logout: () => ipcRenderer.invoke(IPC.AUTH_LOGOUT),
    getSession: () => ipcRenderer.invoke(IPC.AUTH_GET_SESSION),
    syncSession: (data: { token: string; userId: string; userName: string; email: string }) =>
        ipcRenderer.invoke(IPC.AUTH_SYNC_SESSION, data),
}

// Expose typed APIs to renderer
contextBridge.exposeInMainWorld('workspaceApi', workspaceApi)
contextBridge.exposeInMainWorld('notesApi', notesApi)
contextBridge.exposeInMainWorld('codescanApi', codescanApi)
contextBridge.exposeInMainWorld('storyApi', storyApi)
contextBridge.exposeInMainWorld('aiConfigApi', aiConfigApi)
contextBridge.exposeInMainWorld('testsApi', testsApi)
contextBridge.exposeInMainWorld('specTestsApi', specTestsApi)
contextBridge.exposeInMainWorld('authApi', authApi)

/**
 * Git API — exposed as window.gitApi
 */
const gitApi: GitAPI = {
    getStatus: () => ipcRenderer.invoke(IPC.GIT_STATUS),
    getRemoteOrigin: (workspacePath: string) => ipcRenderer.invoke(IPC.GIT_REMOTE_ORIGIN, workspacePath),
}

/**
 * Team API — exposed as window.teamApi
 */
const teamApi: TeamAPI = {
    list: () => ipcRenderer.invoke(IPC.TEAM_LIST),
    ensure: () => ipcRenderer.invoke(IPC.TEAM_ENSURE),
}

/**
 * Project API — exposed as window.projectApi
 */
const projectApi: ProjectAPI = {
    ensure: (teamId: string, slug: string, name: string) =>
        ipcRenderer.invoke(IPC.PROJECT_ENSURE, teamId, slug, name),
}

contextBridge.exposeInMainWorld('gitApi', gitApi)
contextBridge.exposeInMainWorld('teamApi', teamApi)
contextBridge.exposeInMainWorld('projectApi', projectApi)

/**
 * Team AI Config API — exposed as window.teamAiConfigApi
 */
const teamAiConfigApi: TeamAiConfigAPI = {
    list: (teamId: string) => ipcRenderer.invoke(IPC.TEAM_AI_CONFIG_LIST, teamId),
    upsert: (data) => ipcRenderer.invoke(IPC.TEAM_AI_CONFIG_UPSERT, data),
    delete: (id: string) => ipcRenderer.invoke(IPC.TEAM_AI_CONFIG_DELETE, id),
}

contextBridge.exposeInMainWorld('teamAiConfigApi', teamAiConfigApi)
