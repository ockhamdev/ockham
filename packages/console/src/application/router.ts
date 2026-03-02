import { router } from './trpc'
import { teamRouter } from './team.router'
import { projectRouter } from './project.router'
import { noteRouter } from './note.router'
import { storyRouter } from './story.router'
import { testCaseRouter } from './test-case.router'

/**
 * 根 tRPC 路由器
 */
export const appRouter = router({
    team: teamRouter,
    project: projectRouter,
    note: noteRouter,
    story: storyRouter,
    testCase: testCaseRouter,
})

export type AppRouter = typeof appRouter
