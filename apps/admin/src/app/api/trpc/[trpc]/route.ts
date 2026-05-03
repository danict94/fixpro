import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import {
  appRouter,
  sendWhatsAppNotification,
  type AdminEmailVariant,
} from '@fixpro/api'
import { prisma } from '@fixpro/db'
import { auth, requestAdminPasswordReset } from '@/lib/auth'

type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | null

type BetterAuthSessionUser = {
  id: string
  email: string
  name?: string | null
  emailVerified?: boolean
  adminRole?: AdminRole
  phoneNumberVerified?: boolean
}

type BetterAuthSession = {
  user: BetterAuthSessionUser
  session?: {
    createdAt?: Date
  }
}

type WhatsAppNotificationPayload = Parameters<typeof sendWhatsAppNotification>[0]

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const rawSession = await auth.api.getSession({ headers: req.headers })
      const session = rawSession as BetterAuthSession | null

      const sessionUser = session?.user
      const adminRole = sessionUser?.adminRole ?? null

      return {
        db: prisma,
        session: sessionUser
          ? {
              user: {
                id: sessionUser.id,
                email: sessionUser.email,
                name: sessionUser.name ?? '',
                role: 'CLIENT' as const,
                emailVerified: sessionUser.emailVerified ?? false,
                phoneNumberVerified: sessionUser.phoneNumberVerified ?? false,
                adminRole,
              },
              sessionCreatedAt: session?.session?.createdAt ?? null,
            }
          : null,
        sendPasswordResetEmail: async (email: string, variant?: AdminEmailVariant) => {
          await requestAdminPasswordReset(email, variant ?? 'request-reset')
        },
        sendWhatsAppNotification: async (payload: WhatsAppNotificationPayload) => {
          await sendWhatsAppNotification(payload)
        },
      }
    },
    onError({ error }) {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error('[tRPC Admin] Internal error:', error)
      }
    },
  })

export { handler as GET, handler as POST }