import { createTRPCRouter } from './trpc'
import { webRouter } from './root-web'
import { adminAppRouter } from './root-admin'

export { webRouter } from './root-web'
export type { WebRouter } from './root-web'

export { adminAppRouter } from './root-admin'
export type { AdminAppRouter } from './root-admin'

export const appRouter = createTRPCRouter({
  ...webRouter._def.record,
  ...adminAppRouter._def.record,
})

export type AppRouter = typeof appRouter