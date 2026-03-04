import { z } from 'zod'
import { router, protectedProcedure } from './trpc'
import { createId, toId } from '@/backend/domain/shared'
import { DrizzleUserTokenRepository } from '@/backend/infrastructure/repositories/user-token.repository'
import { TRPCError } from '@trpc/server'

const repo = new DrizzleUserTokenRepository()

/**
 * Generate a cryptographically random token string.
 * Format: okt_<40 hex chars> (total 44 chars)
 */
function generateRawToken(): string {
    const bytes = new Uint8Array(20)
    crypto.getRandomValues(bytes)
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
    return `okt_${hex}`
}

/**
 * SHA-256 hash of a string, returned as hex.
 */
async function hashToken(raw: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(raw)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const userTokenRouter = router({
    /**
     * Create a new token. Returns the raw token ONCE — it cannot be retrieved again.
     */
    create: protectedProcedure
        .input(z.object({
            name: z.string().min(1).max(100),
            expiresInDays: z.number().int().positive().optional(), // null = never
        }))
        .mutation(async ({ input, ctx }) => {
            const rawToken = generateRawToken()
            const tokenHash = await hashToken(rawToken)
            const tokenPrefix = rawToken.slice(0, 12) // "okt_xxxxxxxx"

            const expiresAt = input.expiresInDays
                ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
                : null

            const now = new Date()
            const token = await repo.create({
                id: createId(),
                userId: toId(ctx.userId),
                name: input.name,
                tokenHash,
                tokenPrefix,
                expiresAt,
                lastUsedAt: null,
                revokedAt: null,
                createdAt: now,
                updatedAt: now,
            })

            // Return the raw token ONCE — never stored in DB
            return {
                ...token,
                rawToken,
            }
        }),

    /**
     * List all tokens for the current user.
     * Does NOT return tokenHash or raw token.
     */
    list: protectedProcedure
        .query(async ({ ctx }) => {
            const tokens = await repo.findByUserId(toId(ctx.userId))
            return tokens.map((t) => ({
                id: t.id,
                name: t.name,
                tokenPrefix: t.tokenPrefix,
                expiresAt: t.expiresAt,
                lastUsedAt: t.lastUsedAt,
                revokedAt: t.revokedAt,
                createdAt: t.createdAt,
                isExpired: t.expiresAt ? t.expiresAt < new Date() : false,
                isRevoked: !!t.revokedAt,
            }))
        }),

    /**
     * Revoke a token (soft-delete — marks as revoked but keeps record).
     */
    revoke: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const token = await repo.findById(toId(input.id))
            if (!token || token.userId !== ctx.userId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Token not found' })
            }
            await repo.revoke(toId(input.id))
        }),

    /**
     * Permanently delete a token.
     */
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const token = await repo.findById(toId(input.id))
            if (!token || token.userId !== ctx.userId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Token not found' })
            }
            await repo.delete(toId(input.id))
        }),
})
