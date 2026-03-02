import type { WorkspaceAPI, NotesAPI, CodeScanAPI, StoryAPI, AiConfigAPI, TestsAPI, SpecTestsAPI, AuthAPI, GitAPI, TeamAPI, ProjectAPI, TeamAiConfigAPI } from '@ockham/shared'

declare global {
    interface Window {
        workspaceApi: WorkspaceAPI
        notesApi: NotesAPI
        codescanApi: CodeScanAPI
        storyApi: StoryAPI
        aiConfigApi: AiConfigAPI
        testsApi: TestsAPI
        specTestsApi: SpecTestsAPI
        authApi: AuthAPI
        gitApi: GitAPI
        teamApi: TeamAPI
        projectApi: ProjectAPI
        teamAiConfigApi: TeamAiConfigAPI
    }
}
