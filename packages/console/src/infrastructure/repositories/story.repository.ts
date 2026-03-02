import { eq, asc } from 'drizzle-orm'
import { db } from '../db'
import { stories, storyMessages } from '../db/schema'
import { toId } from '@/domain/shared'
import type { Id } from '@/domain/shared'
import type { Story, StoryMessage, StoryRepository } from '@/domain/story'

export class DrizzleStoryRepository implements StoryRepository {
    async create(story: Story): Promise<Story> {
        const [row] = await db.insert(stories).values({
            id: story.id,
            projectId: story.projectId,
            title: story.title,
            enrichedText: story.enrichedText,
            prompt: story.prompt,
            createdBy: story.createdBy,
            createdAt: story.createdAt,
            updatedAt: story.updatedAt,
        }).returning()
        return this.toStory(row)
    }

    async findById(id: Id): Promise<Story | null> {
        const [row] = await db.select().from(stories).where(eq(stories.id, id))
        return row ? this.toStory(row) : null
    }

    async findByProjectId(projectId: Id): Promise<Story[]> {
        const rows = await db.select().from(stories).where(eq(stories.projectId, projectId))
        return rows.map((r) => this.toStory(r))
    }

    async update(id: Id, data: Partial<Pick<Story, 'title' | 'enrichedText' | 'prompt'>>): Promise<Story> {
        const [row] = await db
            .update(stories)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(stories.id, id))
            .returning()
        return this.toStory(row)
    }

    async delete(id: Id): Promise<void> {
        await db.delete(stories).where(eq(stories.id, id))
    }

    // ── Message Operations ──

    async addMessage(message: StoryMessage): Promise<StoryMessage> {
        const [row] = await db.insert(storyMessages).values({
            id: message.id,
            storyId: message.storyId,
            role: message.role,
            content: message.content,
            order: message.order,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
        }).returning()
        return this.toMessage(row)
    }

    async findMessages(storyId: Id): Promise<StoryMessage[]> {
        const rows = await db
            .select()
            .from(storyMessages)
            .where(eq(storyMessages.storyId, storyId))
            .orderBy(asc(storyMessages.order))
        return rows.map((r) => this.toMessage(r))
    }

    async deleteMessages(storyId: Id): Promise<void> {
        await db.delete(storyMessages).where(eq(storyMessages.storyId, storyId))
    }

    private toStory(row: typeof stories.$inferSelect): Story {
        return {
            id: toId(row.id),
            projectId: toId(row.projectId),
            title: row.title,
            enrichedText: row.enrichedText,
            prompt: row.prompt,
            createdBy: toId(row.createdBy),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }

    private toMessage(row: typeof storyMessages.$inferSelect): StoryMessage {
        return {
            id: toId(row.id),
            storyId: toId(row.storyId),
            role: row.role,
            content: row.content,
            order: row.order,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }
}
