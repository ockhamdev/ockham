import { z } from 'zod'
import { router, protectedProcedure } from './trpc'
import { createId, toId } from '@/backend/domain/shared'
import {
    createIssue,
    startProgress,
    resolveIssue,
    closeIssue,
    reopenIssue,
    changePriority,
    assignIssue,
    updateIssueDetails,
} from '@/backend/domain/issue'
import { DrizzleIssueRepository } from '@/backend/infrastructure/repositories/issue.repository'

const issueRepo = new DrizzleIssueRepository()

export const issueRouter = router({
    /**
     * 创建 Issue — Load → Execute(factory) → Persist
     */
    create: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            title: z.string().min(1),
            description: z.string().default(''),
            priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        }))
        .mutation(async ({ input, ctx }) => {
            const issue = createIssue({
                id: createId(),
                projectId: toId(input.projectId),
                title: input.title,
                description: input.description,
                priority: input.priority,
                createdBy: toId(ctx.userId),
            })
            return issueRepo.save(issue)
        }),

    /**
     * 列出项目下所有 Issue。
     */
    list: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ input }) => {
            return issueRepo.findByProjectId(toId(input.projectId))
        }),

    /**
     * 按 ID 查询 Issue。
     */
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            return issueRepo.findById(toId(input.id))
        }),

    /**
     * 更新 Issue 详情（标题、描述）— Load → Execute → Persist
     */
    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            title: z.string().optional(),
            description: z.string().optional(),
            priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
            assigneeId: z.string().nullable().optional(),
        }))
        .mutation(async ({ input }) => {
            const issue = await issueRepo.findById(toId(input.id))
            if (!issue) throw new Error('Issue not found')

            let updated = updateIssueDetails(issue, {
                title: input.title,
                description: input.description,
            })

            if (input.priority !== undefined) {
                updated = changePriority(updated, input.priority)
            }

            if (input.assigneeId !== undefined) {
                updated = assignIssue(updated, input.assigneeId ? toId(input.assigneeId) : null)
            }

            return issueRepo.save(updated)
        }),

    /**
     * 状态流转 — Load → Execute(domain transition) → Persist
     */
    transition: protectedProcedure
        .input(z.object({
            id: z.string(),
            action: z.enum(['start', 'resolve', 'close', 'reopen']),
        }))
        .mutation(async ({ input }) => {
            const issue = await issueRepo.findById(toId(input.id))
            if (!issue) throw new Error('Issue not found')

            const transitionMap = {
                start: startProgress,
                resolve: resolveIssue,
                close: closeIssue,
                reopen: reopenIssue,
            } as const

            const transitioned = transitionMap[input.action](issue)
            return issueRepo.save(transitioned)
        }),

    /**
     * 删除 Issue。
     */
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await issueRepo.delete(toId(input.id))
        }),
})
