import type { BaseEntity, Id } from '../shared'

/**
 * 项目知识条目 — 项目级别的知识管理。
 */
export interface ProjectKnowledgeEntry extends BaseEntity {
    readonly projectId: Id
    readonly title: string
    readonly content: string
    readonly createdBy: Id
    readonly updatedBy: Id
}

export interface ProjectKnowledgeEntryRepository {
    findByProjectId(projectId: Id): Promise<ProjectKnowledgeEntry[]>
    findById(id: Id): Promise<ProjectKnowledgeEntry | null>
    save(entry: ProjectKnowledgeEntry): Promise<ProjectKnowledgeEntry>
    delete(id: Id): Promise<void>
}
