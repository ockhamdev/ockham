import { eq, desc } from 'drizzle-orm'
import { db } from '../db'
import { projectKnowledgeEntries } from '../db/schema'
import { toId } from '@/backend/domain/shared'
import type { Id } from '@/backend/domain/shared'
import type { ProjectKnowledgeEntry, ProjectKnowledgeEntryRepository } from '@/backend/domain/project-knowledge'

export class DrizzleProjectKnowledgeEntryRepository implements ProjectKnowledgeEntryRepository {
    async findByProjectId(projectId: Id): Promise<ProjectKnowledgeEntry[]> {
        const rows = await db
            .select()
            .from(projectKnowledgeEntries)
            .where(eq(projectKnowledgeEntries.projectId, projectId))
            .orderBy(desc(projectKnowledgeEntries.updatedAt))
        return rows.map((r) => this.toEntry(r))
    }

    async findById(id: Id): Promise<ProjectKnowledgeEntry | null> {
        const [row] = await db.select().from(projectKnowledgeEntries).where(eq(projectKnowledgeEntries.id, id))
        return row ? this.toEntry(row) : null
    }

    async save(entry: ProjectKnowledgeEntry): Promise<ProjectKnowledgeEntry> {
        const [row] = await db
            .insert(projectKnowledgeEntries)
            .values({
                id: entry.id,
                projectId: entry.projectId,
                title: entry.title,
                content: entry.content,
                createdBy: entry.createdBy,
                updatedBy: entry.updatedBy,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
            })
            .onConflictDoUpdate({
                target: projectKnowledgeEntries.id,
                set: {
                    title: entry.title,
                    content: entry.content,
                    updatedBy: entry.updatedBy,
                    updatedAt: entry.updatedAt,
                },
            })
            .returning()
        return this.toEntry(row)
    }

    async delete(id: Id): Promise<void> {
        await db.delete(projectKnowledgeEntries).where(eq(projectKnowledgeEntries.id, id))
    }

    private toEntry(row: typeof projectKnowledgeEntries.$inferSelect): ProjectKnowledgeEntry {
        return {
            id: toId(row.id),
            projectId: toId(row.projectId),
            title: row.title,
            content: row.content,
            createdBy: toId(row.createdBy),
            updatedBy: toId(row.updatedBy),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }
}
