import { z } from 'zod'
import { router, protectedProcedure } from './trpc'
import { createId, toId } from '@/backend/domain/shared'
import { DrizzleTeamRepository } from '@/backend/infrastructure/repositories/team.repository'

const teamRepo = new DrizzleTeamRepository()

export const teamRouter = router({
    create: protectedProcedure
        .input(z.object({ name: z.string().min(1), slug: z.string().min(1) }))
        .mutation(async ({ input, ctx }) => {
            const now = new Date()
            const teamId = createId()
            const team = await teamRepo.create({
                id: teamId,
                name: input.name,
                slug: input.slug,
                createdAt: now,
                updatedAt: now,
            })
            // 创建者自动成为 owner
            await teamRepo.addMember({
                id: createId(),
                teamId: team.id,
                userId: toId(ctx.userId),
                role: 'owner',
                createdAt: now,
                updatedAt: now,
            })
            return team
        }),

    list: protectedProcedure.query(async ({ ctx }) => {
        return teamRepo.findByUserId(toId(ctx.userId))
    }),

    /**
     * Ensure the user has at least one team.
     * If no team exists, create a personal team and add user as owner.
     */
    ensureTeam: protectedProcedure.query(async ({ ctx }) => {
        const userId = toId(ctx.userId)
        const teams = await teamRepo.findByUserId(userId)
        if (teams.length > 0) return teams[0]

        // Auto-create personal team
        const now = new Date()
        const teamId = createId()
        const slug = `personal-${ctx.userId.slice(0, 8)}`
        const userName = ctx.session.user.name || ctx.session.user.email?.split('@')[0] || 'User'
        const team = await teamRepo.create({
            id: teamId,
            name: `${userName}'s Team`,
            slug,
            createdAt: now,
            updatedAt: now,
        })
        await teamRepo.addMember({
            id: createId(),
            teamId: team.id,
            userId,
            role: 'owner',
            createdAt: now,
            updatedAt: now,
        })
        return team
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            return teamRepo.findById(toId(input.id))
        }),

    update: protectedProcedure
        .input(z.object({ id: z.string(), name: z.string().optional(), slug: z.string().optional() }))
        .mutation(async ({ input }) => {
            const { id, ...data } = input
            return teamRepo.update(toId(id), data)
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await teamRepo.delete(toId(input.id))
        }),

    // ── Member Operations ──

    listMembers: protectedProcedure
        .input(z.object({ teamId: z.string() }))
        .query(async ({ input }) => {
            return teamRepo.findMembers(toId(input.teamId))
        }),

    addMember: protectedProcedure
        .input(z.object({ teamId: z.string(), userId: z.string(), role: z.enum(['owner', 'admin', 'member']).default('member') }))
        .mutation(async ({ input }) => {
            const now = new Date()
            return teamRepo.addMember({
                id: createId(),
                teamId: toId(input.teamId),
                userId: toId(input.userId),
                role: input.role,
                createdAt: now,
                updatedAt: now,
            })
        }),

    updateMemberRole: protectedProcedure
        .input(z.object({ id: z.string(), role: z.enum(['owner', 'admin', 'member']) }))
        .mutation(async ({ input }) => {
            return teamRepo.updateMemberRole(toId(input.id), input.role)
        }),

    removeMember: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await teamRepo.removeMember(toId(input.id))
        }),
})
