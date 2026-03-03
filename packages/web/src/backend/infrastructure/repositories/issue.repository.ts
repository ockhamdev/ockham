import { eq, desc } from 'drizzle-orm'
import { db } from '../db'
import { issues } from '../db/schema'
import { toId } from '@/backend/domain/shared'
import type { Id } from '@/backend/domain/shared'
import type { Issue, IssueRepository } from '@/backend/domain/issue'

export class DrizzleIssueRepository implements IssueRepository {
    async save(issue: Issue): Promise<Issue> {
        const [row] = await db
            .insert(issues)
            .values({
                id: issue.id,
                projectId: issue.projectId,
                title: issue.title,
                description: issue.description,
                status: issue.status,
                priority: issue.priority,
                assigneeId: issue.assigneeId,
                createdBy: issue.createdBy,
                createdAt: issue.createdAt,
                updatedAt: issue.updatedAt,
            })
            .onConflictDoUpdate({
                target: issues.id,
                set: {
                    title: issue.title,
                    description: issue.description,
                    status: issue.status,
                    priority: issue.priority,
                    assigneeId: issue.assigneeId,
                    updatedAt: issue.updatedAt,
                },
            })
            .returning()
        return this.toIssue(row)
    }

    async findById(id: Id): Promise<Issue | null> {
        const [row] = await db.select().from(issues).where(eq(issues.id, id))
        return row ? this.toIssue(row) : null
    }

    async findByProjectId(projectId: Id): Promise<Issue[]> {
        const rows = await db
            .select()
            .from(issues)
            .where(eq(issues.projectId, projectId))
            .orderBy(desc(issues.createdAt))
        return rows.map((r) => this.toIssue(r))
    }

    async delete(id: Id): Promise<void> {
        await db.delete(issues).where(eq(issues.id, id))
    }

    private toIssue(row: typeof issues.$inferSelect): Issue {
        return {
            id: toId(row.id),
            projectId: toId(row.projectId),
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            assigneeId: row.assigneeId ? toId(row.assigneeId) : null,
            createdBy: toId(row.createdBy),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }
}
