import type { BaseEntity, Id } from '../shared'

/**
 * 规格测试单元实体
 */
export interface SpecTestUnit extends BaseEntity {
    readonly specTestId: Id
    readonly path: string
    readonly unitName: string
    readonly unitType: string
    readonly unitFilePath: string
    readonly contentHash: string
}

/**
 * 规格测试组实体
 */
export interface SpecTestGroup extends BaseEntity {
    readonly projectId: Id
    readonly key: string
    readonly name: string
    readonly parentKey: string | null
    readonly preconditions: string
}

/**
 * 规格测试聚合根
 */
export interface SpecTest extends BaseEntity {
    readonly projectId: Id
    readonly groupId: Id | null
    readonly groupKey: string | null
    readonly title: string
    readonly description: string
    readonly proposedBy: string | null
    readonly status: ProposalStatus
    readonly linkedFilePath: string | null
    readonly linkedHash: string | null
    readonly linkedAt: Date | null
    readonly reviewedBy: Id | null
    readonly reviewNote: string
    readonly implementation: string
}

/**
 * 单元测试用例聚合根
 */
export interface TestCase extends BaseEntity {
    readonly projectId: Id
    readonly path: string
    readonly contentHash: string
    readonly description: string
    readonly createdBy: Id
    readonly proposedBy: string | null
    readonly status: ProposalStatus
    readonly linkedFilePath: string | null
    readonly linkedHash: string | null
    readonly linkedAt: Date | null
    readonly reviewedBy: Id | null
    readonly reviewNote: string
    readonly implementation: string
}

/**
 * 提议状态
 */
export type ProposalStatus = 'pending' | 'approved' | 'rejected'

/**
 * 单元测试提议
 */
export interface UnitTestProposal extends BaseEntity {
    readonly projectId: Id
    readonly path: string
    readonly contentHash: string
    readonly description: string
    readonly proposedBy: string
    readonly status: ProposalStatus
    readonly linkedFilePath: string | null
    readonly linkedHash: string | null
    readonly linkedAt: Date | null
    readonly reviewedBy: Id | null
    readonly reviewNote: string
    readonly implementation: string
}

/**
 * 规格测试提议
 */
export interface SpecTestProposal extends BaseEntity {
    readonly projectId: Id
    readonly title: string
    readonly description: string
    readonly groupKey: string | null
    readonly proposedBy: string
    readonly status: ProposalStatus
    readonly linkedFilePath: string | null
    readonly linkedHash: string | null
    readonly linkedAt: Date | null
    readonly reviewedBy: Id | null
    readonly reviewNote: string
    readonly implementation: string
}

