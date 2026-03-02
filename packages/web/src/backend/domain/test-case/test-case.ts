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
    readonly title: string
    readonly description: string
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
}
