import { eq } from 'drizzle-orm'
import { db } from '../db'
import { teamAiConfigs } from '../db/schema'
import { toId } from '@/backend/domain/shared'
import type { Id } from '@/backend/domain/shared'
import type { TeamAiConfig } from '@/backend/domain/team/team'

export class DrizzleTeamAiConfigRepository {
    async create(config: TeamAiConfig): Promise<TeamAiConfig> {
        const [row] = await db.insert(teamAiConfigs).values({
            id: config.id,
            teamId: config.teamId,
            provider: config.provider,
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            models: JSON.stringify(config.models),
            isDefault: config.isDefault,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
        }).returning()
        return this.toConfig(row)
    }

    async findByTeamId(teamId: Id): Promise<TeamAiConfig[]> {
        const rows = await db.select().from(teamAiConfigs).where(eq(teamAiConfigs.teamId, teamId))
        return rows.map((r) => this.toConfig(r))
    }

    async findById(id: Id): Promise<TeamAiConfig | null> {
        const [row] = await db.select().from(teamAiConfigs).where(eq(teamAiConfigs.id, id))
        return row ? this.toConfig(row) : null
    }

    async update(id: Id, data: Partial<Pick<TeamAiConfig, 'provider' | 'apiKey' | 'baseUrl' | 'models' | 'isDefault'>>): Promise<TeamAiConfig> {
        const updateData: Record<string, unknown> = { updatedAt: new Date() }
        if (data.provider !== undefined) updateData.provider = data.provider
        if (data.apiKey !== undefined) updateData.apiKey = data.apiKey
        if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl
        if (data.models !== undefined) updateData.models = JSON.stringify(data.models)
        if (data.isDefault !== undefined) updateData.isDefault = data.isDefault

        const [row] = await db
            .update(teamAiConfigs)
            .set(updateData)
            .where(eq(teamAiConfigs.id, id))
            .returning()
        return this.toConfig(row)
    }

    async delete(id: Id): Promise<void> {
        await db.delete(teamAiConfigs).where(eq(teamAiConfigs.id, id))
    }

    private toConfig(row: typeof teamAiConfigs.$inferSelect): TeamAiConfig {
        let models: string[] = []
        try {
            models = JSON.parse(row.models)
        } catch { /* fallback to empty */ }

        return {
            id: toId(row.id),
            teamId: toId(row.teamId),
            provider: row.provider,
            apiKey: row.apiKey,
            baseUrl: row.baseUrl,
            models,
            isDefault: row.isDefault,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }
}
