import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { auth } from '@/backend/infrastructure/auth'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/backend/infrastructure/db'
import { userTokens } from '@/backend/infrastructure/db/schema'

/**
 * SHA-256 hash (hex string)
 */
async function sha256(input: string): Promise<string> {
    const data = new TextEncoder().encode(input)
    const buf = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * tRPC 上下文 — 支持两种认证方式：
 * 1. better-auth cookie session（Web UI）
 * 2. Bearer token（MCP / API）
 */
export async function createTRPCContext() {
    const hdrs = await headers()

    // 1️⃣ Try Bearer token auth first
    const authorization = hdrs.get('authorization')
    if (authorization?.startsWith('Bearer ')) {
        const rawToken = authorization.slice(7)
        const tokenHash = await sha256(rawToken)
        const [row] = await db.select().from(userTokens).where(eq(userTokens.tokenHash, tokenHash))

        if (row && !row.revokedAt && (!row.expiresAt || row.expiresAt > new Date())) {
            // Update lastUsedAt (fire-and-forget)
            db.update(userTokens).set({ lastUsedAt: new Date() }).where(eq(userTokens.id, row.id)).then(() => { })
            return {
                session: { user: { id: row.userId } } as { user: { id: string } },
            }
        }
    }

    // 2️⃣ Fall back to better-auth session (cookie-based)
    const session = await auth.api.getSession({
        headers: hdrs,
    })

    return {
        session,
    }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<TRPCContext>().create({
    transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory

/**
 * 受保护的 procedure — 需要登录（session 或 token）
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session?.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Please sign in first' })
    }
    return next({
        ctx: {
            ...ctx,
            session: ctx.session,
            userId: ctx.session.user.id,
        },
    })
})
