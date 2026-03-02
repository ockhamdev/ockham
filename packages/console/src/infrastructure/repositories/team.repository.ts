import { eq } from 'drizzle-orm'
import { db } from '../db'
import { teams, members } from '../db/schema'
import { toId } from '@/domain/shared'
import type { Id } from '@/domain/shared'
import type { Team, Member, MemberRole, TeamRepository } from '@/domain/team'

export class DrizzleTeamRepository implements TeamRepository {
    async create(team: Team): Promise<Team> {
        const [row] = await db.insert(teams).values({
            id: team.id,
            name: team.name,
            slug: team.slug,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
        }).returning()
        return this.toTeam(row)
    }

    async findById(id: Id): Promise<Team | null> {
        const [row] = await db.select().from(teams).where(eq(teams.id, id))
        return row ? this.toTeam(row) : null
    }

    async findBySlug(slug: string): Promise<Team | null> {
        const [row] = await db.select().from(teams).where(eq(teams.slug, slug))
        return row ? this.toTeam(row) : null
    }

    async findByUserId(userId: Id): Promise<Team[]> {
        const rows = await db
            .select({ team: teams })
            .from(teams)
            .innerJoin(members, eq(teams.id, members.teamId))
            .where(eq(members.userId, userId))
        return rows.map((r) => this.toTeam(r.team))
    }

    async update(id: Id, data: Partial<Pick<Team, 'name' | 'slug'>>): Promise<Team> {
        const [row] = await db
            .update(teams)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(teams.id, id))
            .returning()
        return this.toTeam(row)
    }

    async delete(id: Id): Promise<void> {
        await db.delete(teams).where(eq(teams.id, id))
    }

    // ── Member Operations ──

    async addMember(member: Member): Promise<Member> {
        const [row] = await db.insert(members).values({
            id: member.id,
            teamId: member.teamId,
            userId: member.userId,
            role: member.role,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt,
        }).returning()
        return this.toMember(row)
    }

    async findMembers(teamId: Id): Promise<Member[]> {
        const rows = await db.select().from(members).where(eq(members.teamId, teamId))
        return rows.map((r) => this.toMember(r))
    }

    async findMember(teamId: Id, userId: Id): Promise<Member | null> {
        const rows = await db
            .select()
            .from(members)
            .where(eq(members.teamId, teamId))
        const row = rows.find((r) => r.userId === userId)
        return row ? this.toMember(row) : null
    }

    async updateMemberRole(id: Id, role: MemberRole): Promise<Member> {
        const [row] = await db
            .update(members)
            .set({ role, updatedAt: new Date() })
            .where(eq(members.id, id))
            .returning()
        return this.toMember(row)
    }

    async removeMember(id: Id): Promise<void> {
        await db.delete(members).where(eq(members.id, id))
    }

    private toTeam(row: typeof teams.$inferSelect): Team {
        return {
            id: toId(row.id),
            name: row.name,
            slug: row.slug,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }

    private toMember(row: typeof members.$inferSelect): Member {
        return {
            id: toId(row.id),
            teamId: toId(row.teamId),
            userId: toId(row.userId),
            role: row.role,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }
}
