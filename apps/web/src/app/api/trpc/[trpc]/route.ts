import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { webRouter } from '@fixpro/api/root-web'
import { prisma } from '@fixpro/db'
import {
  auth,
  requestUserEmailVerification,
  requestUserMagicLink,
  requestUserPasswordReset,
} from '@/lib/auth'

const VALID_ROLES = new Set(['CLIENT', 'COMPANY'])

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: webRouter,
    createContext: async () => {
      const session = await auth.api.getSession({ headers: req.headers })

      return {
        db: prisma,
        session: session
          ? {
              user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                role: (() => {
                  const raw = (session.user as Record<string, unknown>).role as string | undefined
                  return raw && VALID_ROLES.has(raw) ? raw : 'CLIENT'
                })(),
                emailVerified: session.user.emailVerified ?? false,
                phoneNumberVerified:
                  ((session.user as Record<string, unknown>).phoneNumberVerified as
                    | boolean
                    | undefined) ?? false,
                adminRole:
                  ((session.user as Record<string, unknown>).adminRole as
                    | 'SUPER_ADMIN'
                    | 'ADMIN'
                    | null
                    | undefined) ?? null,
              },
              sessionCreatedAt:
                (session as { session?: { createdAt?: Date } }).session?.createdAt ?? null,
            }
          : null,
        sendPasswordResetEmail: async (email: string) => {
          await requestUserPasswordReset(email)
        },
        sendVerificationEmail: async (email: string, callbackURL?: string) => {
          await requestUserEmailVerification(email, callbackURL)
        },
        sendMagicLink: async (email: string, callbackURL?: string) => {
          await requestUserMagicLink(email, callbackURL, req.headers)
        },
      }
    },
    onError({ error }) {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error('[tRPC] Internal error:', error)
      }
    },
  })

export { handler as GET, handler as POST }