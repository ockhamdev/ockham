import type { BaseEntity, Id } from '../shared'

/**
 * 故事消息角色
 */
export type StoryMessageRole = 'user' | 'assistant'

/**
 * 故事消息实体
 */
export interface StoryMessage extends BaseEntity {
    readonly storyId: Id
    readonly role: StoryMessageRole
    readonly content: string
    readonly order: number
}

/**
 * 故事聚合根
 */
export interface Story extends BaseEntity {
    readonly projectId: Id
    readonly title: string
    readonly enrichedText: string
    readonly prompt: string
    readonly createdBy: Id
}

/**
 * 故事 提案条目
 */
export type StoryProposalStatus = 'pending' | 'approved' | 'rejected'

export interface StoryProposal extends BaseEntity {
    readonly projectId: Id
    readonly title: string
    readonly enrichedText: string
    readonly prompt: string
    readonly proposedBy: string
    readonly status: StoryProposalStatus
    readonly reviewedBy: Id | null
    readonly reviewNote: string
}
