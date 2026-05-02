import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, sendWhatsAppNotification } from '@fixpro/api'
import { prisma } from '@fixpro/db'
import { auth, requestAdminPasswordReset } from '@/lib/auth'
import type { AdminEmailVariant } from '@fixpro/api'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const session = await auth.api.getSession({ headers: req.headers })
      const adminRole = (session?.user as Record<string, unknown>)?.adminRole as string | null ?? null

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
                phoneNumberVerified: ((session.user as Record<string, unknown>).phoneNumberVerified as boolean | undefined) ?? false,
                adminRole: adminRole as 'SUPER_ADMIN' | 'ADMIN' | null,
              },
              sessionCreatedAt: (session as { session?: { createdAt?: Date } }).session?.createdAt ?? null,
            }
          : null,
        sendPasswordResetEmail: async (email: string, variant?: AdminEmailVariant) => {
          await requestAdminPasswordReset(email, variant ?? 'request-reset')
        },
        sendWhatsAppNotification: async (payload) => {
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
