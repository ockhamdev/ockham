import { z } from 'zod'
import { router, protectedProcedure } from './trpc'
import { createId, toId } from '@/backend/domain/shared'
import { DrizzleProjectKnowledgeEntryRepository } from '@/backend/infrastructure/repositories/project-knowledge-entry.repository'

const repo = new DrizzleProjectKnowledgeEntryRepository()

export const projectKnowledgeRouter = router({
    list: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ input }) => {
            return repo.findByProjectId(toId(input.projectId))
        }),

    create: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            title: z.string().min(1),
            content: z.string().default(''),
        }))
        .mutation(async ({ input, ctx }) => {
            const now = new Date()
            const userId = toId(ctx.userId)
            return repo.save({
                id: createId(),
                projectId: toId(input.projectId),
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
            const existing = await repo.findById(toId(input.id))
            if (!existing) throw new Error('Knowledge entry not found')
            return repo.save({
                ...existing,
                ...(input.title !== undefined && { title: input.title }),
                ...(input.content !== undefined && { content: input.content }),
                updatedBy: toId(ctx.userId),
                updatedAt: new Date(),
            })
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await repo.delete(toId(input.id))
        }),
})
