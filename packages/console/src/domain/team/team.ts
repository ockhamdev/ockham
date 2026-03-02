import type { BaseEntity, Id } from '../shared'

/**
 * 成员角色枚举
 */
export type MemberRole = 'owner' | 'admin' | 'member'

/**
 * 团队成员实体
 */
export interface Member extends BaseEntity {
    readonly teamId: Id
    readonly userId: Id
    readonly role: MemberRole
}

/**
 * 团队聚合根
 */
export interface Team extends BaseEntity {
    readonly name: string
    readonly slug: string
}
