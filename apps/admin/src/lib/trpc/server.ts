import 'server-only'

import { createCallerFactory } from '@fixpro/api/trpc'
import { adminAppRouter } from '@fixpro/api/root-admin'
import { prisma } from '@fixpro/db'
import { cache } from 'react'
import { headers } from 'next/headers'

import { auth } from '@/lib/auth'

const createContext = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() })

  return {
    db: prisma,
    session: session
      ? {
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role:
              ((session.user as Record<string, unknown>).role as string | undefined) ?? 'CLIENT',
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
  }
})

const createCaller = createCallerFactory(adminAppRouter)

export const api = createCaller(createContext)