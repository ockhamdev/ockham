import { z } from 'zod'
import { router, protectedProcedure } from './trpc'
import { createId, toId } from '@/backend/domain/shared'
import { DrizzleKnowledgeEntryRepository } from '@/backend/infrastructure/repositories/knowledge-entry.repository'

const repo = new DrizzleKnowledgeEntryRepository()

export const knowledgeEntryRouter = router({
    list: protectedProcedure
        .input(z.object({ teamId: z.string() }))
        .query(async ({ input }) => {
            return repo.findByTeamId(toId(input.teamId))
        }),

    create: protectedProcedure
        .input(z.object({
            teamId: z.string(),
            title: z.string().min(1),
            content: z.string().default(''),
        }))
        .mutation(async ({ input, ctx }) => {
            const now = new Date()
            const userId = toId(ctx.userId)
            return repo.create({
                id: createId(),
                teamId: toId(input.teamId),
                title: input.title,
                content: input.content,
                createdBy: userId,
                updatedBy: userId,
                createdAt: now,
                updatedAt: now,
            })
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            title: z.string().min(1).optional(),
            content: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            const { id, ...data } = input
            return repo.update(toId(id), { ...data, updatedBy: toId(ctx.userId) })
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await repo.delete(toId(input.id))
        }),
})
