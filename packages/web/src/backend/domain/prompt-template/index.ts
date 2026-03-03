import type { BaseEntity, Id } from '../shared'

// ── Template Types ─────────────────────────────────────

export type PromptTemplateType = 'unit_test' | 'spec_test'

// ── Entity ─────────────────────────────────────────────

export interface PromptTemplate extends BaseEntity {
    readonly teamId: Id
    readonly type: PromptTemplateType
    readonly template: string
}

// ── Repository ─────────────────────────────────────────

export interface PromptTemplateRepository {
    findByTeamAndType(teamId: Id, type: PromptTemplateType): Promise<PromptTemplate | null>
    save(entry: PromptTemplate): Promise<PromptTemplate>
    deleteByTeamAndType(teamId: Id, type: PromptTemplateType): Promise<void>
}

// ── Default Templates ──────────────────────────────────

export const DEFAULT_UNIT_TEST_TEMPLATE = `## Unit Test Generation

Please write a unit test for the following code using **Vitest** framework.

### Test Metadata
- **Test ID**: \`{{testId}}\`
- **File Path**: \`{{filePath}}\`
- **Keyword**: \`{{keyword}}\`

### Requirements
{{description}}

### Implementation Source
\`\`\`typescript
{{sourceSnippet}}
\`\`\`

### Instructions
1. Use \`vitest\` as the test framework (\`describe\`, \`test\`, \`expect\`)
2. The \`describe\` block description MUST use format: \`[{{testId}}] <descriptive name>\`
   - The ID prefix \`[{{testId}}]\` is mandatory for linking test results back to this test case
   - Generate a clear, descriptive name based on the keyword \`{{keyword}}\` (do NOT just use the keyword literally)
3. Use \`test()\` for each individual test case inside the \`describe\` block
4. Example structure:
\`\`\`typescript
describe('[{{testId}}] <descriptive name based on {{keyword}}>', () => {
  test('should ...', () => {
    // ...
  })
  test('should handle edge case', () => {
    // ...
  })
})
\`\`\`
5. Write test cases that verify the behavior described above
6. Use \`test()\` for unique individual cases; use \`test.each()\` for parameterized/data-driven scenarios with multiple input-output pairs
7. Mock external dependencies as needed
8. Cover edge cases and error handling
9. Do NOT write the test code immediately. First propose the test logic and cases, then wait for user confirmation before writing the actual test implementation`

export const DEFAULT_SPEC_TEST_TEMPLATE = `## Spec Test Generation

Please write a spec/integration test that verifies the collaborative behavior of the following syntax units.

### Test Metadata
- **Test ID**: \`{{testId}}\`
- **Title**: {{title}}
- **Group**: {{groupPath}}
{{preconditionSection}}{{requirementsSection}}
### Referenced Syntax Units

{{sourceSnippets}}

### Instructions
1. Use \`@playwright/test\` as the test framework (\`test\`, \`expect\`, \`Page\`).  
   If the project has not yet configured \`@playwright/test\`, initialize the environment first:
   \`\`\`bash
   pnpm add -D @playwright/test
   npx playwright install
   \`\`\`
2. The test file should be placed in the \`tests/\` directory located at the same level as the nearest \`tsconfig.json\` relative to the source file being tested.
3. The \`test.describe\` block description **MUST** use the format: \`[{{testId}}] {{title}}\`
4. All test cases must comply with the **Group Preconditions** defined above (if any). Abstract reusable setup logic (e.g. login, database initialization) into shared fixtures or helper functions.
5. Test the **collaborative behavior** between the listed syntax units.
6. Mock external dependencies as needed.
7. Cover edge cases and error handling.
8. Do **NOT** write the test code immediately. First propose the test logic and cases, then wait for user confirmation.`
