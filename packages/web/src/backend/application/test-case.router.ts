import { z } from 'zod'
import { router, protectedProcedure } from './trpc'
import { createId, toId } from '@/backend/domain/shared'
import { DrizzleTestCaseRepository } from '@/backend/infrastructure/repositories/test-case.repository'

const testCaseRepo = new DrizzleTestCaseRepository()

export const testCaseRouter = router({
    // ── Unit Test Cases ──

    create: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            path: z.string(),
            contentHash: z.string().default(''),
            description: z.string().default(''),
        }))
        .mutation(async ({ input, ctx }) => {
            const now = new Date()
            return testCaseRepo.createTestCase({
                id: createId(),
                projectId: toId(input.projectId),
                path: input.path,
                contentHash: input.contentHash,
                description: input.description,
                createdBy: toId(ctx.userId),
                createdAt: now,
                updatedAt: now,
            })
        }),

    list: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ input }) => {
            return testCaseRepo.findTestCasesByProjectId(toId(input.projectId))
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            return testCaseRepo.findTestCaseById(toId(input.id))
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            path: z.string().optional(),
            contentHash: z.string().optional(),
            description: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            const { id, ...data } = input
            return testCaseRepo.updateTestCase(toId(id), data)
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await testCaseRepo.deleteTestCase(toId(input.id))
        }),

    // ── Spec Tests ──

    createSpecTest: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            groupId: z.string().nullable().default(null),
            title: z.string().min(1),
            description: z.string().default(''),
        }))
        .mutation(async ({ input }) => {
            const now = new Date()
            return testCaseRepo.createSpecTest({
                id: createId(),
                projectId: toId(input.projectId),
                groupId: input.groupId ? toId(input.groupId) : null,
                title: input.title,
                description: input.description,
                createdAt: now,
                updatedAt: now,
            })
        }),

    listSpecTests: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ input }) => {
            return testCaseRepo.findSpecTestsByProjectId(toId(input.projectId))
        }),

    updateSpecTest: protectedProcedure
        .input(z.object({
            id: z.string(),
            title: z.string().optional(),
            description: z.string().optional(),
            groupId: z.string().nullable().optional(),
        }))
        .mutation(async ({ input }) => {
            const { id, ...data } = input
            const mapped: Record<string, unknown> = {}
            if (data.title !== undefined) mapped.title = data.title
            if (data.description !== undefined) mapped.description = data.description
            if (data.groupId !== undefined) mapped.groupId = data.groupId ? toId(data.groupId) : null
            return testCaseRepo.updateSpecTest(toId(id), mapped as never)
        }),

    deleteSpecTest: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await testCaseRepo.deleteSpecTest(toId(input.id))
        }),

    // ── Spec Test Groups ──

    createSpecTestGroup: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            key: z.string(),
            name: z.string().min(1),
            parentKey: z.string().nullable().default(null),
            preconditions: z.string().default(''),
        }))
        .mutation(async ({ input }) => {
            const now = new Date()
            return testCaseRepo.createSpecTestGroup({
                id: createId(),
                projectId: toId(input.projectId),
                key: input.key,
                name: input.name,
                parentKey: input.parentKey,
                preconditions: input.preconditions,
                createdAt: now,
                updatedAt: now,
            })
        }),

    listSpecTestGroups: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ input }) => {
            return testCaseRepo.findSpecTestGroupsByProjectId(toId(input.projectId))
        }),

    deleteSpecTestGroup: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await testCaseRepo.deleteSpecTestGroup(toId(input.id))
        }),
})
