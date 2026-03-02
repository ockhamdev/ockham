import type { BaseEntity, Id } from '../shared'

/**
 * 笔记聚合根
 */
export interface Note extends BaseEntity {
    readonly projectId: Id
    readonly title: string
    readonly content: string
    readonly createdBy: Id
}
