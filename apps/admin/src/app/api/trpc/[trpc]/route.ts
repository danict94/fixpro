import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import {
  appRouter,
  sendWhatsAppNotification,
  type AdminEmailVariant,
} from '@fixpro/api'
import { prisma } from '@fixpro/db'
import { auth, requestAdminPasswordReset } from '@/lib/auth'

type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | null

type WhatsAppNotificationPayload = Parameters<typeof sendWhatsAppNotification>[0]

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const session = await auth.api.getSession({ headers: req.headers })

      const sessionUser = session?.user as
        | (typeof session.user & {
            adminRole?: AdminRole
            phoneNumberVerified?: boolean
          })
        | undefined

      const adminRole = sessionUser?.adminRole ?? null

      return {
        db: prisma,
        session: session
          ? {
              user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                role: 'CLIENT' as const,
                emailVerified: session.user.emailVerified ?? false,
                phoneNumberVerified: sessionUser?.phoneNumberVerified ?? false,
                adminRole,
              },
              sessionCreatedAt:
                (session as { session?: { createdAt?: Date } }).session?.createdAt ?? null,
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