import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { auth } from '@/backend/infrastructure/auth'
import { headers } from 'next/headers'
import { db } from '@/backend/infrastructure/db'
import { sessions, users } from '@/backend/infrastructure/db/schema'
import { eq, and, gt } from 'drizzle-orm'

/**
 * tRPC 上下文 — 通过 better-auth cookie session 认证
 *
 * better-auth 的 getSession 需要签名 cookie (token.signature)。
 * 但 Desktop 的 renderer 通过 fetch 登录时，浏览器安全策略不允许
 * JS 读取 set-cookie header，所以只能保存 JSON body 里的裸 token。
 *
 * 当签名 cookie 验证失败时，回退到直接用裸 token 查询数据库。
 */
export async function createTRPCContext() {
    const hdrs = await headers()

    // 1. Try better-auth signed cookie validation (preferred)
    const session = await auth.api.getSession({
        headers: hdrs,
    })

    if (session) {
        return { session }
    }

    // 2. Fallback: extract bare token from cookie and look up in DB
    const cookieHeader = hdrs.get('cookie') || ''
    const tokenMatch = cookieHeader.match(/better-auth\.session_token=([^;.\s]+)/)
    const bareToken = tokenMatch?.[1]

    if (bareToken) {
        const [row] = await db
            .select({
                sessionId: sessions.id,
                sessionToken: sessions.token,
                expiresAt: sessions.expiresAt,
                userId: sessions.userId,
                userName: users.name,
                userEmail: users.email,
                userImage: users.image,
                userEmailVerified: users.emailVerified,
                userCreatedAt: users.createdAt,
                userUpdatedAt: users.updatedAt,
            })
            .from(sessions)
            .innerJoin(users, eq(sessions.userId, users.id))
            .where(
                and(
                    eq(sessions.token, bareToken),
                    gt(sessions.expiresAt, new Date()),
                )
            )
            .limit(1)

        if (row) {
            return {
                session: {
                    session: {
                        id: row.sessionId,
                        token: row.sessionToken,
                        expiresAt: row.expiresAt,
                        userId: row.userId,
                    },
                    user: {
                        id: row.userId,
                        name: row.userName,
                        email: row.userEmail,
                        image: row.userImage,
                        emailVerified: row.userEmailVerified,
                        createdAt: row.userCreatedAt,
                        updatedAt: row.userUpdatedAt,
                    },
                },
            }
        }
    }

    return { session: null }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<TRPCContext>().create({
    transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory

/**
 * 受保护的 procedure — 需要登录
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

