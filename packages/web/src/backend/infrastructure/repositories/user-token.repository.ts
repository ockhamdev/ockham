import { eq } from 'drizzle-orm'
import { db } from '../db'
import { userTokens } from '../db/schema'
import { toId } from '@/backend/domain/shared'
import type { Id } from '@/backend/domain/shared'
import type { UserToken, TokenScope, UserTokenRepository } from '@/backend/domain/user-token'

export class DrizzleUserTokenRepository implements UserTokenRepository {
    async create(token: UserToken): Promise<UserToken> {
        const [row] = await db.insert(userTokens).values({
            id: token.id,
            userId: token.userId,
            name: token.name,
            tokenHash: token.tokenHash,
            tokenPrefix: token.tokenPrefix,
            scopes: JSON.stringify(token.scopes),
            expiresAt: token.expiresAt,
            lastUsedAt: token.lastUsedAt,
            revokedAt: token.revokedAt,
            createdAt: token.createdAt,
        }).returning()
        return this.toToken(row)
    }

    async findByUserId(userId: Id): Promise<UserToken[]> {
        const rows = await db.select().from(userTokens).where(eq(userTokens.userId, userId))
        return rows.map((r) => this.toToken(r))
    }

    async findByTokenHash(tokenHash: string): Promise<UserToken | null> {
        const [row] = await db.select().from(userTokens).where(eq(userTokens.tokenHash, tokenHash))
        return row ? this.toToken(row) : null
    }

    async findById(id: Id): Promise<UserToken | null> {
        const [row] = await db.select().from(userTokens).where(eq(userTokens.id, id))
        return row ? this.toToken(row) : null
    }

    async revoke(id: Id): Promise<void> {
        await db.update(userTokens).set({ revokedAt: new Date() }).where(eq(userTokens.id, id))
    }

    async updateLastUsed(id: Id): Promise<void> {
        await db.update(userTokens).set({ lastUsedAt: new Date() }).where(eq(userTokens.id, id))
    }

    async delete(id: Id): Promise<void> {
        await db.delete(userTokens).where(eq(userTokens.id, id))
    }

    private toToken(row: typeof userTokens.$inferSelect): UserToken {
        let scopes: TokenScope[] = []
        try {
            scopes = JSON.parse(row.scopes)
        } catch { /* fallback to empty */ }

        return {
            id: toId(row.id),
            userId: toId(row.userId),
            name: row.name,
            tokenHash: row.tokenHash,
            tokenPrefix: row.tokenPrefix,
            scopes,
            expiresAt: row.expiresAt,
            lastUsedAt: row.lastUsedAt,
            revokedAt: row.revokedAt,
            createdAt: row.createdAt,
            updatedAt: row.createdAt, // no updatedAt column — use createdAt
        }
    }
}
