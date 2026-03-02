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

/**
 * 团队 AI 配置
 */
export interface TeamAiConfig extends BaseEntity {
    readonly teamId: Id
    readonly provider: string
    readonly apiKey: string
    readonly baseUrl: string
    readonly models: string[]
    readonly isDefault: boolean
}
