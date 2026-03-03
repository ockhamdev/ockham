import type { BaseEntity, Id } from '../shared'

/**
 * Token scope — 控制 token 可以访问的资源范围
 */
export type TokenScope = 'mcp:read' | 'mcp:write' | 'api:read' | 'api:write'

/**
 * 用户授权 Token 实体
 *
 * 用于 MCP 服务和外部 API 的身份认证与授权。
 * 安全设计：token 明文仅在创建时返回一次，数据库只存 SHA-256 hash。
 */
export interface UserToken extends BaseEntity {
    readonly userId: Id
    readonly name: string
    readonly tokenHash: string       // SHA-256 of raw token
    readonly tokenPrefix: string     // "okt_xxxxxxxx" for display
    readonly scopes: TokenScope[]
    readonly expiresAt: Date | null
    readonly lastUsedAt: Date | null
    readonly revokedAt: Date | null
}
