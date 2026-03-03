import type { Id } from '../shared'
import type { Issue } from './issue'

/**
 * 问题仓储接口 — 在领域层定义，由基础设施层实现。
 * 每个聚合根一个仓储。
 */
export interface IssueRepository {
    save(issue: Issue): Promise<Issue>
    findById(id: Id): Promise<Issue | null>
    findByProjectId(projectId: Id): Promise<Issue[]>
    delete(id: Id): Promise<void>
}
