import type { BaseEntity, Id } from '../shared'

/**
 * 项目聚合根 — 属于一个团队
 */
export interface Project extends BaseEntity {
    readonly teamId: Id
    readonly name: string
    readonly slug: string
    readonly description: string
}
