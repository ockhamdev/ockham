import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/backend/application/router'
import { createTRPCContext } from '@/backend/application/trpc'

const handler = (req: Request) =>
    fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext: createTRPCContext,
    })

export { handler as GET, handler as POST }
