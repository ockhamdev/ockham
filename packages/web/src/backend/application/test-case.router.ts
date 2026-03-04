import { z } from 'zod'
import { router, protectedProcedure } from './trpc'
import { createId, toId } from '@/backend/domain/shared'
import { DrizzleTestCaseRepository } from '@/backend/infrastructure/repositories/test-case.repository'
import { TRPCError } from '@trpc/server'

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
                proposedBy: null,
                status: 'approved',
                linkedFilePath: null,
                linkedHash: null,
                linkedAt: null,
                reviewedBy: null,
                reviewNote: '',
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

    // ── Approve Linked Unit Test ──

    approveLinkedTest: protectedProcedure
        .input(z.object({
            id: z.string(),
            linkedFilePath: z.string(),
            linkedHash: z.string(),
        }))
        .mutation(async ({ input }) => {
            return testCaseRepo.updateTestCase(toId(input.id), {
                linkedFilePath: input.linkedFilePath,
                linkedHash: input.linkedHash,
                linkedAt: new Date(),
            })
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
                groupKey: null,
                title: input.title,
                description: input.description,
                proposedBy: null,
                status: 'approved',
                linkedFilePath: null,
                linkedHash: null,
                linkedAt: null,
                reviewedBy: null,
                reviewNote: '',
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

    // ── Approve Linked Spec Test ──

    approveLinkedSpecTest: protectedProcedure
        .input(z.object({
            id: z.string(),
            linkedFilePath: z.string(),
            linkedHash: z.string(),
        }))
        .mutation(async ({ input }) => {
            return testCaseRepo.updateSpecTest(toId(input.id), {
                linkedFilePath: input.linkedFilePath,
                linkedHash: input.linkedHash,
                linkedAt: new Date(),
            })
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

    // ── Unit Test Proposals ──

    listUnitTestProposals: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ input }) => {
            return testCaseRepo.findUnitTestProposalByProjectId(toId(input.projectId))
        }),

    createUnitTestProposal: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            path: z.string(),
            contentHash: z.string().default(''),
            description: z.string().default(''),
            proposedBy: z.string(),
        }))
        .mutation(async ({ input }) => {
            const now = new Date()
            return testCaseRepo.createUnitTestProposal({
                id: createId(),
                projectId: toId(input.projectId),
                path: input.path,
                contentHash: input.contentHash,
                description: input.description,
                proposedBy: input.proposedBy,
                status: 'pending',
                linkedFilePath: null,
                linkedHash: null,
                linkedAt: null,
                reviewedBy: null,
                reviewNote: '',
                createdAt: now,
                updatedAt: now,
            })
        }),

    updateUnitTestProposalLink: protectedProcedure
        .input(z.object({
            id: z.string(),
            linkedFilePath: z.string(),
            linkedHash: z.string(),
        }))
        .mutation(async ({ input }) => {
            return testCaseRepo.updateUnitTestProposal(toId(input.id), {
                linkedFilePath: input.linkedFilePath,
                linkedHash: input.linkedHash,
            })
        }),

    reviewUnitTestProposal: protectedProcedure
        .input(z.object({
            id: z.string(),
            action: z.enum(['approve', 'reject']),
            reviewNote: z.string().default(''),
        }))
        .mutation(async ({ input, ctx }) => {
            const entry = await testCaseRepo.findUnitTestProposalById(toId(input.id))
            if (!entry) throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' })

            if (input.action === 'approve') {
                // Must be linked before approval
                if (!entry.linkedFilePath) {
                    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Test must be linked before approval' })
                }

                // Move proposal → unit test
                const now = new Date()
                await testCaseRepo.createTestCase({
                    id: createId(),
                    projectId: entry.projectId,
                    path: entry.path,
                    contentHash: entry.contentHash,
                    description: entry.description,
                    createdBy: toId(ctx.userId),
                    proposedBy: entry.proposedBy,
                    status: 'approved',
                    linkedFilePath: entry.linkedFilePath,
                    linkedHash: entry.linkedHash,
                    linkedAt: now,
                    reviewedBy: toId(ctx.userId),
                    reviewNote: input.reviewNote,
                    createdAt: entry.createdAt,
                    updatedAt: now,
                })

                // Delete proposal after successful move
                await testCaseRepo.deleteUnitTestProposal(toId(input.id))
                return { moved: true }
            }

            // Reject: keep proposal with rejected status
            return testCaseRepo.updateUnitTestProposal(toId(input.id), {
                status: 'rejected',
                reviewedBy: toId(ctx.userId),
                reviewNote: input.reviewNote,
            })
        }),

    deleteUnitTestProposal: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await testCaseRepo.deleteUnitTestProposal(toId(input.id))
        }),

    batchDeleteUnitTestProposals: protectedProcedure
        .input(z.object({ ids: z.array(z.string()).min(1) }))
        .mutation(async ({ input }) => {
            await testCaseRepo.batchDeleteUnitTestProposals(input.ids.map(toId))
        }),

    updateUnitTestProposalContent: protectedProcedure
        .input(z.object({
            id: z.string(),
            path: z.string().optional(),
            description: z.string().optional(),
            contentHash: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            const { id, ...data } = input
            const mapped: Record<string, unknown> = {}
            if (data.path !== undefined) mapped.path = data.path
            if (data.description !== undefined) mapped.description = data.description
            if (data.contentHash !== undefined) mapped.contentHash = data.contentHash
            // Reuse the existing updateUnitTestProposal which accepts partial updates
            const [row] = await (await import('@/backend/infrastructure/db')).db
                .update((await import('@/backend/infrastructure/db/schema')).unitTestProposals)
                .set({ ...mapped, updatedAt: new Date() })
                .where((await import('drizzle-orm')).eq((await import('@/backend/infrastructure/db/schema')).unitTestProposals.id, toId(id)))
                .returning()
            return row
        }),

    // ── Spec Test Proposals ──

    listSpecTestProposals: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ input }) => {
            return testCaseRepo.findSpecTestProposalByProjectId(toId(input.projectId))
        }),

    createSpecTestProposal: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            title: z.string().min(1),
            description: z.string().default(''),
            groupKey: z.string().nullable().default(null),
            proposedBy: z.string(),
        }))
        .mutation(async ({ input }) => {
            const now = new Date()
            return testCaseRepo.createSpecTestProposal({
                id: createId(),
                projectId: toId(input.projectId),
                title: input.title,
                description: input.description,
                groupKey: input.groupKey,
                proposedBy: input.proposedBy,
                status: 'pending',
                linkedFilePath: null,
                linkedHash: null,
                linkedAt: null,
                reviewedBy: null,
                reviewNote: '',
                createdAt: now,
                updatedAt: now,
            })
        }),

    updateSpecTestProposalLink: protectedProcedure
        .input(z.object({
            id: z.string(),
            linkedFilePath: z.string(),
            linkedHash: z.string(),
        }))
        .mutation(async ({ input }) => {
            return testCaseRepo.updateSpecTestProposal(toId(input.id), {
                linkedFilePath: input.linkedFilePath,
                linkedHash: input.linkedHash,
            })
        }),

    reviewSpecTestProposal: protectedProcedure
        .input(z.object({
            id: z.string(),
            action: z.enum(['approve', 'reject']),
            reviewNote: z.string().default(''),
        }))
        .mutation(async ({ input, ctx }) => {
            const entry = await testCaseRepo.findSpecTestProposalById(toId(input.id))
            if (!entry) throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' })

            if (input.action === 'approve') {
                // Must be linked before approval
                if (!entry.linkedFilePath) {
                    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Test must be linked before approval' })
                }

                // Move proposal → spec test
                const now = new Date()
                await testCaseRepo.createSpecTest({
                    id: createId(),
                    projectId: entry.projectId,
                    groupId: null,
                    groupKey: entry.groupKey ?? null,
                    title: entry.title,
                    description: entry.description,
                    proposedBy: entry.proposedBy,
                    status: 'approved',
                    linkedFilePath: entry.linkedFilePath,
                    linkedHash: entry.linkedHash,
                    linkedAt: now,
                    reviewedBy: toId(ctx.userId),
                    reviewNote: input.reviewNote,
                    createdAt: entry.createdAt,
                    updatedAt: now,
                })

                // Delete proposal after successful move
                await testCaseRepo.deleteSpecTestProposal(toId(input.id))
                return { moved: true }
            }

            // Reject: keep proposal with rejected status
            return testCaseRepo.updateSpecTestProposal(toId(input.id), {
                status: 'rejected',
                reviewedBy: toId(ctx.userId),
                reviewNote: input.reviewNote,
            })
        }),

    deleteSpecTestProposal: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await testCaseRepo.deleteSpecTestProposal(toId(input.id))
        }),

    batchDeleteSpecTestProposals: protectedProcedure
        .input(z.object({ ids: z.array(z.string()).min(1) }))
        .mutation(async ({ input }) => {
            await testCaseRepo.batchDeleteSpecTestProposals(input.ids.map(toId))
        }),

    updateSpecTestProposalContent: protectedProcedure
        .input(z.object({
            id: z.string(),
            title: z.string().optional(),
            description: z.string().optional(),
            groupKey: z.string().nullable().optional(),
        }))
        .mutation(async ({ input }) => {
            const { id, ...data } = input
            const mapped: Record<string, unknown> = {}
            if (data.title !== undefined) mapped.title = data.title
            if (data.description !== undefined) mapped.description = data.description
            if (data.groupKey !== undefined) mapped.groupKey = data.groupKey
            const [row] = await (await import('@/backend/infrastructure/db')).db
                .update((await import('@/backend/infrastructure/db/schema')).specTestProposals)
                .set({ ...mapped, updatedAt: new Date() })
                .where((await import('drizzle-orm')).eq((await import('@/backend/infrastructure/db/schema')).specTestProposals.id, toId(id)))
                .returning()
            return row
        }),
})

