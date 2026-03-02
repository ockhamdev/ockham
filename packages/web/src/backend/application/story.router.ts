import { z } from 'zod'
import { router, protectedProcedure } from './trpc'
import { createId, toId } from '@/backend/domain/shared'
import { DrizzleStoryRepository } from '@/backend/infrastructure/repositories/story.repository'

const storyRepo = new DrizzleStoryRepository()

export const storyRouter = router({
    create: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            title: z.string().min(1),
            enrichedText: z.string().default(''),
            prompt: z.string().default(''),
        }))
        .mutation(async ({ input, ctx }) => {
            const now = new Date()
            return storyRepo.create({
                id: createId(),
                projectId: toId(input.projectId),
                title: input.title,
                enrichedText: input.enrichedText,
                prompt: input.prompt,
                createdBy: toId(ctx.userId),
                createdAt: now,
                updatedAt: now,
            })
        }),

    list: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ input }) => {
            return storyRepo.findByProjectId(toId(input.projectId))
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            return storyRepo.findById(toId(input.id))
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            title: z.string().optional(),
            enrichedText: z.string().optional(),
            prompt: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            const { id, ...data } = input
            return storyRepo.update(toId(id), data)
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await storyRepo.delete(toId(input.id))
        }),

    // ── Message Operations ──

    addMessage: protectedProcedure
        .input(z.object({
            storyId: z.string(),
            role: z.enum(['user', 'assistant']),
            content: z.string(),
            order: z.number().int(),
        }))
        .mutation(async ({ input }) => {
            const now = new Date()
            return storyRepo.addMessage({
                id: createId(),
                storyId: toId(input.storyId),
                role: input.role,
                content: input.content,
                order: input.order,
                createdAt: now,
                updatedAt: now,
            })
        }),

    listMessages: protectedProcedure
        .input(z.object({ storyId: z.string() }))
        .query(async ({ input }) => {
            return storyRepo.findMessages(toId(input.storyId))
        }),
})
