import { z } from 'zod'
import { router, protectedProcedure } from './trpc'
import { createId, toId } from '@/backend/domain/shared'
import { DrizzleProjectRepository } from '@/backend/infrastructure/repositories/project.repository'
import { normalizeGitRemoteUrl } from '@ockham/shared'
import { db } from '@/backend/infrastructure/db'
import { projects, members } from '@/backend/infrastructure/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

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

    /**
     * Find or create a project by slug (git remote origin) within a team.
     */
    ensureBySlug: protectedProcedure
        .input(z.object({
            teamId: z.string(),
            slug: z.string().min(1),
            name: z.string().min(1),
        }))
        .mutation(async ({ input }) => {
            const teamId = toId(input.teamId)
            const slug = normalizeGitRemoteUrl(input.slug)
            const existing = await projectRepo.findBySlug(teamId, slug)
            if (existing) return existing

            const now = new Date()
            return projectRepo.create({
                id: createId(),
                teamId,
                name: input.name,
                slug,
                description: '',
                createdAt: now,
                updatedAt: now,
            })
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

    /**
     * Find projects by git remote URL across all teams the user belongs to.
     * Normalizes the URL to a slug before matching.
     * Returns an array — if length > 1, caller should ask user to choose.
     */
    findByGitRemote: protectedProcedure
        .input(z.object({
            gitRemoteUrl: z.string().min(1),
        }))
        .query(async ({ input, ctx }) => {
            const slug = normalizeGitRemoteUrl(input.gitRemoteUrl)

            // Get all team IDs the user belongs to
            const userTeams = await db
                .select({ teamId: members.teamId })
                .from(members)
                .where(eq(members.userId, ctx.userId!))

            if (userTeams.length === 0) return []

            const teamIds = userTeams.map((t) => t.teamId)

            // Find projects with matching slug in any of the user's teams
            const rows = await db
                .select()
                .from(projects)
                .where(and(
                    inArray(projects.teamId, teamIds),
                    eq(projects.slug, slug)
                ))

            return rows.map((r) => ({
                id: r.id,
                teamId: r.teamId,
                name: r.name,
                slug: r.slug,
                description: r.description,
            }))
        }),
})
