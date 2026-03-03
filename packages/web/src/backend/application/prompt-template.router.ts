import { z } from 'zod'
import { router, protectedProcedure } from './trpc'
import { createId, toId } from '@/backend/domain/shared'
import { DrizzlePromptTemplateRepository } from '@/backend/infrastructure/repositories/prompt-template.repository'
import {
    DEFAULT_UNIT_TEST_TEMPLATE,
    DEFAULT_SPEC_TEST_TEMPLATE,
    type PromptTemplateType,
} from '@/backend/domain/prompt-template'

const repo = new DrizzlePromptTemplateRepository()

const templateTypeSchema = z.enum(['unit_test', 'spec_test'])

function getDefault(type: PromptTemplateType): string {
    return type === 'unit_test' ? DEFAULT_UNIT_TEST_TEMPLATE : DEFAULT_SPEC_TEST_TEMPLATE
}

export const promptTemplateRouter = router({
    /** Get template for team+type. Returns default if none saved. */
    get: protectedProcedure
        .input(z.object({
            teamId: z.string(),
            type: templateTypeSchema,
        }))
        .query(async ({ input }) => {
            const existing = await repo.findByTeamAndType(toId(input.teamId), input.type)
            return {
                template: existing?.template ?? getDefault(input.type),
                isCustom: !!existing,
                id: existing?.id ?? null,
            }
        }),

    /** Save (upsert) template */
    save: protectedProcedure
        .input(z.object({
            teamId: z.string(),
            type: templateTypeSchema,
            template: z.string().min(1),
        }))
        .mutation(async ({ input }) => {
            // Check if one already exists
            const existing = await repo.findByTeamAndType(toId(input.teamId), input.type)
            const now = new Date()
            return repo.save({
                id: existing?.id ?? createId(),
                teamId: toId(input.teamId),
                type: input.type,
                template: input.template,
                createdAt: existing?.createdAt ?? now,
                updatedAt: now,
            })
        }),

    /** Reset to default — deletes custom template */
    reset: protectedProcedure
        .input(z.object({
            teamId: z.string(),
            type: templateTypeSchema,
        }))
        .mutation(async ({ input }) => {
            await repo.deleteByTeamAndType(toId(input.teamId), input.type)
            return { template: getDefault(input.type) }
        }),

    /** Get the default template (no DB lookup) */
    getDefault: protectedProcedure
        .input(z.object({ type: templateTypeSchema }))
        .query(({ input }) => {
            return { template: getDefault(input.type) }
        }),
})
