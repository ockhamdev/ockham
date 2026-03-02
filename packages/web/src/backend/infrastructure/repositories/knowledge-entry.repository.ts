import { eq } from 'drizzle-orm'
import { db } from '../db'
import { knowledgeEntries } from '../db/schema'
import { toId } from '@/backend/domain/shared'
import type { Id } from '@/backend/domain/shared'
import type { KnowledgeEntry } from '@/backend/domain/team'

export class DrizzleKnowledgeEntryRepository {
    async findByTeamId(teamId: Id): Promise<KnowledgeEntry[]> {
        const rows = await db
            .select()
            .from(knowledgeEntries)
            .where(eq(knowledgeEntries.teamId, teamId))
            .orderBy(knowledgeEntries.updatedAt)
        return rows.map((r) => this.toEntry(r))
    }

    async findById(id: Id): Promise<KnowledgeEntry | null> {
        const [row] = await db.select().from(knowledgeEntries).where(eq(knowledgeEntries.id, id))
        return row ? this.toEntry(row) : null
    }

    async create(entry: KnowledgeEntry): Promise<KnowledgeEntry> {
        const [row] = await db.insert(knowledgeEntries).values({
            id: entry.id,
            teamId: entry.teamId,
            title: entry.title,
            content: entry.content,
            createdBy: entry.createdBy,
            updatedBy: entry.updatedBy,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
        }).returning()
        return this.toEntry(row)
    }

    async update(id: Id, data: Partial<Pick<KnowledgeEntry, 'title' | 'content'>> & { updatedBy: Id }): Promise<KnowledgeEntry> {
        const [row] = await db
            .update(knowledgeEntries)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(knowledgeEntries.id, id))
            .returning()
        return this.toEntry(row)
    }

    async delete(id: Id): Promise<void> {
        await db.delete(knowledgeEntries).where(eq(knowledgeEntries.id, id))
    }

    private toEntry(row: typeof knowledgeEntries.$inferSelect): KnowledgeEntry {
        return {
            id: toId(row.id),
            teamId: toId(row.teamId),
            title: row.title,
            content: row.content,
            createdBy: toId(row.createdBy),
            updatedBy: toId(row.updatedBy),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }
}
