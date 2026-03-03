import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { promptTemplates } from '../db/schema'
import { toId } from '@/backend/domain/shared'
import type { Id } from '@/backend/domain/shared'
import type { PromptTemplate, PromptTemplateType, PromptTemplateRepository } from '@/backend/domain/prompt-template'

export class DrizzlePromptTemplateRepository implements PromptTemplateRepository {
    async findByTeamAndType(teamId: Id, type: PromptTemplateType): Promise<PromptTemplate | null> {
        const [row] = await db
            .select()
            .from(promptTemplates)
            .where(and(
                eq(promptTemplates.teamId, teamId),
                eq(promptTemplates.type, type),
            ))
        return row ? this.toEntity(row) : null
    }

    async save(entry: PromptTemplate): Promise<PromptTemplate> {
        const [row] = await db
            .insert(promptTemplates)
            .values({
                id: entry.id,
                teamId: entry.teamId,
                type: entry.type,
                template: entry.template,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
            })
            .onConflictDoUpdate({
                target: promptTemplates.id,
                set: {
                    template: entry.template,
                    updatedAt: entry.updatedAt,
                },
            })
            .returning()
        return this.toEntity(row)
    }

    async deleteByTeamAndType(teamId: Id, type: PromptTemplateType): Promise<void> {
        await db.delete(promptTemplates).where(and(
            eq(promptTemplates.teamId, teamId),
            eq(promptTemplates.type, type),
        ))
    }

    private toEntity(row: typeof promptTemplates.$inferSelect): PromptTemplate {
        return {
            id: toId(row.id),
            teamId: toId(row.teamId),
            type: row.type,
            template: row.template,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }
}
