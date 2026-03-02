import type { Id } from './id'

/**
 * 基础实体接口 — 所有聚合根和实体共享的字段。
 */
export interface BaseEntity {
    readonly id: Id
    readonly createdAt: Date
    readonly updatedAt: Date
}
