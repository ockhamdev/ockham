import type { Id } from '../shared'
import type { UserToken } from './user-token'

/**
 * 用户 Token 仓储接口
 */
export interface UserTokenRepository {
    create(token: UserToken): Promise<UserToken>
    findByUserId(userId: Id): Promise<UserToken[]>
    findByTokenHash(tokenHash: string): Promise<UserToken | null>
    findById(id: Id): Promise<UserToken | null>
    revoke(id: Id): Promise<void>
    updateLastUsed(id: Id): Promise<void>
    delete(id: Id): Promise<void>
}
