import { eq } from 'drizzle-orm'
import { db } from '../db'
import { notes } from '../db/schema'
import { toId } from '@/backend/domain/shared'
import type { Id } from '@/backend/domain/shared'
import type { Note, NoteRepository } from '@/backend/domain/note'

export class DrizzleNoteRepository implements NoteRepository {
    async create(note: Note): Promise<Note> {
        const [row] = await db.insert(notes).values({
            id: note.id,
            projectId: note.projectId,
            title: note.title,
            content: note.content,
            createdBy: note.createdBy,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
        }).returning()
        return this.toNote(row)
    }

    async findById(id: Id): Promise<Note | null> {
        const [row] = await db.select().from(notes).where(eq(notes.id, id))
        return row ? this.toNote(row) : null
    }

    async findByProjectId(projectId: Id): Promise<Note[]> {
        const rows = await db.select().from(notes).where(eq(notes.projectId, projectId))
        return rows.map((r) => this.toNote(r))
    }

    async update(id: Id, data: Partial<Pick<Note, 'title' | 'content'>>): Promise<Note> {
        const [row] = await db
            .update(notes)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(notes.id, id))
            .returning()
        return this.toNote(row)
    }

    async delete(id: Id): Promise<void> {
        await db.delete(notes).where(eq(notes.id, id))
    }

    private toNote(row: typeof notes.$inferSelect): Note {
        return {
            id: toId(row.id),
            projectId: toId(row.projectId),
            title: row.title,
            content: row.content,
            createdBy: toId(row.createdBy),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }
}
