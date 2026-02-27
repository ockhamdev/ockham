export type {
    Note, AppConfig, ScanResult, FileEntry, SyntaxUnit,
    AiConfig, TokenUsage, ObjectTreeNode, RelatedFile, ObjectMapping,
    ObjectMappingResult, AnalysisResult, ScanProgressEvent,
    StoryMessage, StoryIssue, StoryResponse,
    TestCase,
    SpecTest, SpecTestUnit, SpecTestGroup,
} from './types'

// IPC
export { IPC } from './ipc/channels'
export type { IPCChannel } from './ipc/channels'
export type { AddNotePayload, UpdateNotePayload } from './ipc/payloads'
export type { WorkspaceAPI, NotesAPI, CodeScanAPI, StoryAPI, AiConfigAPI, TestsAPI, SpecTestsAPI } from './ipc/api'
