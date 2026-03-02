import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { projects } from '../db/schema'
import { toId } from '@/backend/domain/shared'
import type { Id } from '@/backend/domain/shared'
import type { Project, ProjectRepository } from '@/backend/domain/project'

export class DrizzleProjectRepository implements ProjectRepository {
    async create(project: Project): Promise<Project> {
        const [row] = await db.insert(projects).values({
            id: project.id,
            teamId: project.teamId,
            name: project.name,
            slug: project.slug,
            description: project.description,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        }).returning()
        return this.toProject(row)
    }

    async findById(id: Id): Promise<Project | null> {
        const [row] = await db.select().from(projects).where(eq(projects.id, id))
        return row ? this.toProject(row) : null
    }

    async findBySlug(teamId: Id, slug: string): Promise<Project | null> {
        const [row] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.teamId, teamId), eq(projects.slug, slug)))
        return row ? this.toProject(row) : null
    }

    async findByTeamId(teamId: Id): Promise<Project[]> {
        const rows = await db.select().from(projects).where(eq(projects.teamId, teamId))
        return rows.map((r) => this.toProject(r))
    }

    async update(id: Id, data: Partial<Pick<Project, 'name' | 'slug' | 'description'>>): Promise<Project> {
        const [row] = await db
            .update(projects)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(projects.id, id))
            .returning()
        return this.toProject(row)
    }

    async delete(id: Id): Promise<void> {
        await db.delete(projects).where(eq(projects.id, id))
    }

    private toProject(row: typeof projects.$inferSelect): Project {
        return {
            id: toId(row.id),
            teamId: toId(row.teamId),
            name: row.name,
            slug: row.slug,
            description: row.description,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }
}
