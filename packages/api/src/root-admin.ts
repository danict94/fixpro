import { createTRPCRouter } from './trpc'
import { authRouter } from './routers/auth'
import { adminRouter } from './routers/admin'
import { adminUsersRouter } from './routers/admin-users'
import { taxonomyRouter } from './routers/taxonomy'
import { assistanceRouter } from './routers/assistance'
import { showcaseRouter } from './routers/showcase'

export const adminAppRouter = createTRPCRouter({
  auth: authRouter,
  admin: adminRouter,
  adminUsers: adminUsersRouter,

  // Router usati dalle pagine admin.
  // Restano disponibili solo all'app admin perché vengono importati da root-admin.
  taxonomy: taxonomyRouter,
  assistance: assistanceRouter,
  showcase: showcaseRouter,
})

export type AdminAppRouter = typeof adminAppRouter