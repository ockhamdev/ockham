import { router } from './trpc'
import { teamRouter } from './team.router'
import { projectRouter } from './project.router'
import { noteRouter } from './note.router'
import { storyRouter } from './story.router'
import { testCaseRouter } from './test-case.router'
import { teamAiConfigRouter } from './team-ai-config.router'
import { knowledgeEntryRouter } from './knowledge-entry.router'
import { issueRouter } from './issue.router'
import { projectKnowledgeRouter } from './project-knowledge.router'
import { promptTemplateRouter } from './prompt-template.router'
import { userTokenRouter } from './user-token.router'

/**
 * 根 tRPC 路由器
 */
export const appRouter = router({
    team: teamRouter,
    project: projectRouter,
    note: noteRouter,
    story: storyRouter,
    testCase: testCaseRouter,
    teamAiConfig: teamAiConfigRouter,
    knowledgeEntry: knowledgeEntryRouter,
    issue: issueRouter,
    projectKnowledge: projectKnowledgeRouter,
    promptTemplate: promptTemplateRouter,
    userToken: userTokenRouter,
})

export type AppRouter = typeof appRouter


