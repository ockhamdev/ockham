import { z } from 'zod'
import { router, protectedProcedure } from './trpc'
import { createId, toId } from '@/backend/domain/shared'
import { DrizzleTeamAiConfigRepository } from '@/backend/infrastructure/repositories/team-ai-config.repository'

const repo = new DrizzleTeamAiConfigRepository()

export const teamAiConfigRouter = router({
    list: protectedProcedure
        .input(z.object({ teamId: z.string() }))
        .query(async ({ input }) => {
            return repo.findByTeamId(toId(input.teamId))
        }),

    upsert: protectedProcedure
        .input(z.object({
            id: z.string().optional(),
            teamId: z.string(),
            provider: z.string().min(1),
            apiKey: z.string().min(1),
            baseUrl: z.string().default(''),
            models: z.array(z.string()).default([]),
            isDefault: z.boolean().default(false),
        }))
        .mutation(async ({ input }) => {
            if (input.id) {
                // Update existing
                const { id, teamId: _teamId, ...data } = input
                return repo.update(toId(id), data)
            }
            // Create new
            const now = new Date()
            return repo.create({
                id: createId(),
                teamId: toId(input.teamId),
                provider: input.provider,
                apiKey: input.apiKey,
                baseUrl: input.baseUrl,
                models: input.models,
                isDefault: input.isDefault,
                createdAt: now,
                updatedAt: now,
            })
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await repo.delete(toId(input.id))
        }),
})
