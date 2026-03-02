import { z } from 'zod'
import { router, protectedProcedure } from './trpc'
import { createId, toId } from '@/domain/shared'
import { DrizzleProjectRepository } from '@/infrastructure/repositories/project.repository'

const projectRepo = new DrizzleProjectRepository()

export const projectRouter = router({
    create: protectedProcedure
        .input(z.object({
            teamId: z.string(),
            name: z.string().min(1),
            slug: z.string().min(1),
            description: z.string().default(''),
        }))
        .mutation(async ({ input }) => {
            const now = new Date()
            return projectRepo.create({
                id: createId(),
                teamId: toId(input.teamId),
                name: input.name,
                slug: input.slug,
                description: input.description,
                createdAt: now,
                updatedAt: now,
            })
        }),

    list: protectedProcedure
        .input(z.object({ teamId: z.string() }))
        .query(async ({ input }) => {
            return projectRepo.findByTeamId(toId(input.teamId))
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            return projectRepo.findById(toId(input.id))
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().optional(),
            slug: z.string().optional(),
            description: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            const { id, ...data } = input
            return projectRepo.update(toId(id), data)
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await projectRepo.delete(toId(input.id))
        }),
})
