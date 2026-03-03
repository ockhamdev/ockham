import type { BaseEntity, Id } from '../shared'

// ── Value Objects (Enums) ─────────────────────────────

/**
 * 问题状态 — 生命周期状态机。
 *
 * open → in_progress → resolved → closed
 *   ↑                      │         │
 *   └──────────────────────┘─────────┘  (reopen)
 */
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

/**
 * 问题优先级。
 */
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical'

// ── Aggregate Root ────────────────────────────────────

/**
 * Issue 聚合根 — 项目内可追踪的问题。
 * 通过 ID 引用 Project、User（不持有对象引用）。
 */
export interface Issue extends BaseEntity {
    readonly projectId: Id
    readonly title: string
    readonly description: string
    readonly status: IssueStatus
    readonly priority: IssuePriority
    readonly assigneeId: Id | null
    readonly createdBy: Id
}

// ── Factory ───────────────────────────────────────────

/**
 * 创建一个新的 Issue（状态: open, 优先级: medium）。
 */
export function createIssue(params: {
    id: Id
    projectId: Id
    title: string
    description?: string
    priority?: IssuePriority
    createdBy: Id
}): Issue {
    if (!params.title.trim()) {
        throw new Error('Issue title must not be empty')
    }
    const now = new Date()
    return {
        id: params.id,
        projectId: params.projectId,
        title: params.title,
        description: params.description ?? '',
        status: 'open',
        priority: params.priority ?? 'medium',
        assigneeId: null,
        createdBy: params.createdBy,
        createdAt: now,
        updatedAt: now,
    }
}

// ── Behavior — State Transitions ─────────────────────

const VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
    open: ['in_progress'],
    in_progress: ['resolved'],
    resolved: ['closed', 'open'],
    closed: ['open'],
}

function assertTransition(issue: Issue, target: IssueStatus): void {
    const allowed = VALID_TRANSITIONS[issue.status]
    if (!allowed.includes(target)) {
        throw new Error(
            `Cannot transition issue from '${issue.status}' to '${target}'`
        )
    }
}

function withStatus(issue: Issue, status: IssueStatus): Issue {
    return { ...issue, status, updatedAt: new Date() }
}

/** open → in_progress */
export function startProgress(issue: Issue): Issue {
    assertTransition(issue, 'in_progress')
    return withStatus(issue, 'in_progress')
}

/** in_progress → resolved */
export function resolveIssue(issue: Issue): Issue {
    assertTransition(issue, 'resolved')
    return withStatus(issue, 'resolved')
}

/** resolved → closed */
export function closeIssue(issue: Issue): Issue {
    assertTransition(issue, 'closed')
    return withStatus(issue, 'closed')
}

/** resolved | closed → open */
export function reopenIssue(issue: Issue): Issue {
    assertTransition(issue, 'open')
    return withStatus(issue, 'open')
}

// ── Behavior — Attribute Changes ─────────────────────

/** 修改优先级。 */
export function changePriority(issue: Issue, priority: IssuePriority): Issue {
    return { ...issue, priority, updatedAt: new Date() }
}

/** 分配 / 取消分配负责人。 */
export function assignIssue(issue: Issue, assigneeId: Id | null): Issue {
    return { ...issue, assigneeId, updatedAt: new Date() }
}

/** 修改标题和描述。 */
export function updateIssueDetails(
    issue: Issue,
    data: { title?: string; description?: string },
): Issue {
    if (data.title !== undefined && !data.title.trim()) {
        throw new Error('Issue title must not be empty')
    }
    return {
        ...issue,
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        updatedAt: new Date(),
    }
}
