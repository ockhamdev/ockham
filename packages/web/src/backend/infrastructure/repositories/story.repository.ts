import { eq, asc, inArray } from 'drizzle-orm'
import { db } from '../db'
import { stories, storyMessages, storyProposals } from '../db/schema'
import { toId } from '@/backend/domain/shared'
import type { Id } from '@/backend/domain/shared'
import type { Story, StoryMessage, StoryProposal, StoryRepository } from '@/backend/domain/story'

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

    // ── Proposal Operations ──

    async createProposal(entry: StoryProposal): Promise<StoryProposal> {
        const [row] = await db.insert(storyProposals).values({
            id: entry.id,
            projectId: entry.projectId,
            title: entry.title,
            enrichedText: entry.enrichedText,
            prompt: entry.prompt,
            proposedBy: entry.proposedBy,
            status: entry.status,
            reviewedBy: entry.reviewedBy,
            reviewNote: entry.reviewNote,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
        }).returning()
        return this.toProposal(row)
    }

    async findProposalById(id: Id): Promise<StoryProposal | null> {
        const [row] = await db.select().from(storyProposals).where(eq(storyProposals.id, id))
        return row ? this.toProposal(row) : null
    }

    async findProposalByProjectId(projectId: Id): Promise<StoryProposal[]> {
        const rows = await db.select().from(storyProposals).where(eq(storyProposals.projectId, projectId))
        return rows.map((r) => this.toProposal(r))
    }

    async updateProposal(id: Id, data: Partial<Pick<StoryProposal, 'title' | 'enrichedText' | 'prompt' | 'status' | 'reviewedBy' | 'reviewNote'>>): Promise<StoryProposal> {
        const [row] = await db
            .update(storyProposals)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(storyProposals.id, id))
            .returning()
        return this.toProposal(row)
    }

    async deleteProposal(id: Id): Promise<void> {
        await db.delete(storyProposals).where(eq(storyProposals.id, id))
    }

    async batchDeleteProposals(ids: Id[]): Promise<void> {
        if (ids.length === 0) return
        await db.delete(storyProposals).where(inArray(storyProposals.id, ids))
    }

    // ── Mappers ──

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

    private toProposal(row: typeof storyProposals.$inferSelect): StoryProposal {
        return {
            id: toId(row.id),
            projectId: toId(row.projectId),
            title: row.title,
            enrichedText: row.enrichedText,
            prompt: row.prompt,
            proposedBy: row.proposedBy,
            status: row.status,
            reviewedBy: row.reviewedBy ? toId(row.reviewedBy) : null,
            reviewNote: row.reviewNote,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }
}
