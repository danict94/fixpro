import { createTRPCRouter } from './trpc'
import { authRouter } from './routers/auth'
import { taxonomyRouter } from './routers/taxonomy'
import { companyRouter } from './routers/company'
import { requestsRouter } from './routers/requests'
import { creditsRouter } from './routers/credits'
import { contactsRouter } from './routers/contacts'
import { assistanceRouter } from './routers/assistance'
import { rescuesRouter } from './routers/rescues'
import { showcaseRouter } from './routers/showcase'
import { reviewsRouter } from './routers/reviews'

export const webRouter = createTRPCRouter({
  auth: authRouter,
  taxonomy: taxonomyRouter,
  company: companyRouter,
  requests: requestsRouter,
  credits: creditsRouter,
  contacts: contactsRouter,
  assistance: assistanceRouter,
  rescues: rescuesRouter,
  showcase: showcaseRouter,
  reviews: reviewsRouter,
})

export type WebRouter = typeof webRouter