import { z } from 'zod'
import { router, protectedProcedure } from './trpc'
import { createId, toId } from '@/domain/shared'
import { DrizzleNoteRepository } from '@/infrastructure/repositories/note.repository'

const noteRepo = new DrizzleNoteRepository()

export const noteRouter = router({
    create: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            title: z.string().min(1),
            content: z.string().default(''),
        }))
        .mutation(async ({ input, ctx }) => {
            const now = new Date()
            return noteRepo.create({
                id: createId(),
                projectId: toId(input.projectId),
                title: input.title,
                content: input.content,
                createdBy: toId(ctx.userId),
                createdAt: now,
                updatedAt: now,
            })
        }),

    list: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ input }) => {
            return noteRepo.findByProjectId(toId(input.projectId))
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            return noteRepo.findById(toId(input.id))
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            title: z.string().optional(),
            content: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            const { id, ...data } = input
            return noteRepo.update(toId(id), data)
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await noteRepo.delete(toId(input.id))
        }),
})
