import type { Id } from '../shared'
import type { TestCase, SpecTest, SpecTestGroup, SpecTestUnit } from './test-case'

/**
 * 测试用例仓储接口
 */
export interface TestCaseRepository {
    // 单元测试
    createTestCase(testCase: TestCase): Promise<TestCase>
    findTestCaseById(id: Id): Promise<TestCase | null>
    findTestCasesByProjectId(projectId: Id): Promise<TestCase[]>
    updateTestCase(id: Id, data: Partial<Pick<TestCase, 'path' | 'contentHash' | 'description'>>): Promise<TestCase>
    deleteTestCase(id: Id): Promise<void>

    // 规格测试
    createSpecTest(specTest: SpecTest): Promise<SpecTest>
    findSpecTestById(id: Id): Promise<SpecTest | null>
    findSpecTestsByProjectId(projectId: Id): Promise<SpecTest[]>
    updateSpecTest(id: Id, data: Partial<Pick<SpecTest, 'title' | 'description' | 'groupId'>>): Promise<SpecTest>
    deleteSpecTest(id: Id): Promise<void>

    // 规格测试组
    createSpecTestGroup(group: SpecTestGroup): Promise<SpecTestGroup>
    findSpecTestGroupsByProjectId(projectId: Id): Promise<SpecTestGroup[]>
    updateSpecTestGroup(id: Id, data: Partial<Pick<SpecTestGroup, 'name' | 'parentKey' | 'preconditions'>>): Promise<SpecTestGroup>
    deleteSpecTestGroup(id: Id): Promise<void>

    // 规格测试单元
    addSpecTestUnit(unit: SpecTestUnit): Promise<SpecTestUnit>
    findSpecTestUnits(specTestId: Id): Promise<SpecTestUnit[]>
    deleteSpecTestUnits(specTestId: Id): Promise<void>
}
