import 'server-only'

import { createCallerFactory } from '@fixpro/api/trpc'
import { webRouter } from '@fixpro/api/root-web'
import { prisma } from '@fixpro/db'
import { cache } from 'react'
import { headers } from 'next/headers'

import { auth, requestUserEmailVerification, requestUserMagicLink } from '@/lib/auth'

const VALID_ROLES = new Set(['CLIENT', 'COMPANY'])

/**
 * Context per Server Components e Server Actions.
 * La sessione viene letta dal cookie better-auth.
 */
const createContext = cache(async () => {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })

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
    sendVerificationEmail: async (email: string, callbackURL?: string) => {
      await requestUserEmailVerification(email, callbackURL)
    },
    sendMagicLink: async (email: string, callbackURL?: string) => {
      await requestUserMagicLink(email, callbackURL, requestHeaders)
    },
  }
})

const createCaller = createCallerFactory(webRouter)

export const api = createCaller(createContext)