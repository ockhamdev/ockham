import { eq } from 'drizzle-orm'
import { db } from '../db'
import { unitTests, specTests, specGroups, specTestUnits } from '../db/schema'
import { toId } from '@/backend/domain/shared'
import type { Id } from '@/backend/domain/shared'
import type {
    TestCase,
    SpecTest,
    SpecTestGroup,
    SpecTestUnit,
    TestCaseRepository,
} from '@/backend/domain/test-case'

export class DrizzleTestCaseRepository implements TestCaseRepository {
    // ── Unit Test Cases ──

    async createTestCase(testCase: TestCase): Promise<TestCase> {
        const [row] = await db.insert(unitTests).values({
            id: testCase.id,
            projectId: testCase.projectId,
            path: testCase.path,
            contentHash: testCase.contentHash,
            description: testCase.description,
            createdBy: testCase.createdBy,
            createdAt: testCase.createdAt,
            updatedAt: testCase.updatedAt,
        }).returning()
        return this.toTestCase(row)
    }

    async findTestCaseById(id: Id): Promise<TestCase | null> {
        const [row] = await db.select().from(unitTests).where(eq(unitTests.id, id))
        return row ? this.toTestCase(row) : null
    }

    async findTestCasesByProjectId(projectId: Id): Promise<TestCase[]> {
        const rows = await db.select().from(unitTests).where(eq(unitTests.projectId, projectId))
        return rows.map((r) => this.toTestCase(r))
    }

    async updateTestCase(id: Id, data: Partial<Pick<TestCase, 'path' | 'contentHash' | 'description'>>): Promise<TestCase> {
        const [row] = await db
            .update(unitTests)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(unitTests.id, id))
            .returning()
        return this.toTestCase(row)
    }

    async deleteTestCase(id: Id): Promise<void> {
        await db.delete(unitTests).where(eq(unitTests.id, id))
    }

    // ── Spec Tests ──

    async createSpecTest(specTest: SpecTest): Promise<SpecTest> {
        const [row] = await db.insert(specTests).values({
            id: specTest.id,
            projectId: specTest.projectId,
            groupId: specTest.groupId,
            title: specTest.title,
            description: specTest.description,
            createdAt: specTest.createdAt,
            updatedAt: specTest.updatedAt,
        }).returning()
        return this.toSpecTest(row)
    }

    async findSpecTestById(id: Id): Promise<SpecTest | null> {
        const [row] = await db.select().from(specTests).where(eq(specTests.id, id))
        return row ? this.toSpecTest(row) : null
    }

    async findSpecTestsByProjectId(projectId: Id): Promise<SpecTest[]> {
        const rows = await db.select().from(specTests).where(eq(specTests.projectId, projectId))
        return rows.map((r) => this.toSpecTest(r))
    }

    async updateSpecTest(id: Id, data: Partial<Pick<SpecTest, 'title' | 'description' | 'groupId'>>): Promise<SpecTest> {
        const [row] = await db
            .update(specTests)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(specTests.id, id))
            .returning()
        return this.toSpecTest(row)
    }

    async deleteSpecTest(id: Id): Promise<void> {
        await db.delete(specTests).where(eq(specTests.id, id))
    }

    // ── Spec Test Groups ──

    async createSpecTestGroup(group: SpecTestGroup): Promise<SpecTestGroup> {
        const [row] = await db.insert(specGroups).values({
            id: group.id,
            projectId: group.projectId,
            key: group.key,
            name: group.name,
            parentKey: group.parentKey,
            preconditions: group.preconditions,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
        }).returning()
        return this.toSpecTestGroup(row)
    }

    async findSpecTestGroupsByProjectId(projectId: Id): Promise<SpecTestGroup[]> {
        const rows = await db.select().from(specGroups).where(eq(specGroups.projectId, projectId))
        return rows.map((r) => this.toSpecTestGroup(r))
    }

    async updateSpecTestGroup(id: Id, data: Partial<Pick<SpecTestGroup, 'name' | 'parentKey' | 'preconditions'>>): Promise<SpecTestGroup> {
        const [row] = await db
            .update(specGroups)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(specGroups.id, id))
            .returning()
        return this.toSpecTestGroup(row)
    }

    async deleteSpecTestGroup(id: Id): Promise<void> {
        await db.delete(specGroups).where(eq(specGroups.id, id))
    }

    // ── Spec Test Units ──

    async addSpecTestUnit(unit: SpecTestUnit): Promise<SpecTestUnit> {
        const [row] = await db.insert(specTestUnits).values({
            id: unit.id,
            specTestId: unit.specTestId,
            path: unit.path,
            unitName: unit.unitName,
            unitType: unit.unitType,
            unitFilePath: unit.unitFilePath,
            contentHash: unit.contentHash,
            createdAt: unit.createdAt,
            updatedAt: unit.updatedAt,
        }).returning()
        return this.toSpecTestUnit(row)
    }

    async findSpecTestUnits(specTestId: Id): Promise<SpecTestUnit[]> {
        const rows = await db.select().from(specTestUnits).where(eq(specTestUnits.specTestId, specTestId))
        return rows.map((r) => this.toSpecTestUnit(r))
    }

    async deleteSpecTestUnits(specTestId: Id): Promise<void> {
        await db.delete(specTestUnits).where(eq(specTestUnits.specTestId, specTestId))
    }

    // ── Mappers ──

    private toTestCase(row: typeof unitTests.$inferSelect): TestCase {
        return {
            id: toId(row.id),
            projectId: toId(row.projectId),
            path: row.path,
            contentHash: row.contentHash,
            description: row.description,
            createdBy: toId(row.createdBy),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }

    private toSpecTest(row: typeof specTests.$inferSelect): SpecTest {
        return {
            id: toId(row.id),
            projectId: toId(row.projectId),
            groupId: row.groupId ? toId(row.groupId) : null,
            title: row.title,
            description: row.description,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }

    private toSpecTestGroup(row: typeof specGroups.$inferSelect): SpecTestGroup {
        return {
            id: toId(row.id),
            projectId: toId(row.projectId),
            key: row.key,
            name: row.name,
            parentKey: row.parentKey,
            preconditions: row.preconditions,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }

    private toSpecTestUnit(row: typeof specTestUnits.$inferSelect): SpecTestUnit {
        return {
            id: toId(row.id),
            specTestId: toId(row.specTestId),
            path: row.path,
            unitName: row.unitName,
            unitType: row.unitType,
            unitFilePath: row.unitFilePath,
            contentHash: row.contentHash,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }
}
