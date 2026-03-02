import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { auth } from '@/infrastructure/auth'
import { headers } from 'next/headers'

/**
 * tRPC 上下文 — 注入 session 信息
 */
export async function createTRPCContext() {
    const session = await auth.api.getSession({
        headers: await headers(),
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
 * 受保护的 procedure — 需要登录
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session?.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }
    return next({
        ctx: {
            ...ctx,
            session: ctx.session,
            userId: ctx.session.user.id,
        },
    })
})
