import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import type { prisma } from '@fixpro/db'
import type { AdminEmailVariant } from './lib/admin-email'
import type { WhatsAppNotificationInput } from './lib/whatsapp'
import { requireVerifiedUser } from './lib/verified-user'

// Context type — viene costruito in ogni app (web/admin)
export interface Context {
  db: typeof prisma
  session: {
    user: {
      id: string
      email: string
      name: string
      role: string     // ProductRole: 'CLIENT' | 'COMPANY'
      emailVerified: boolean
      phoneNumberVerified: boolean
      adminRole: 'SUPER_ADMIN' | 'ADMIN' | null
    }
    sessionCreatedAt: Date | null // timestamp reale del record Session — per confronto con adminSessionInvalidatedAt
  } | null
  sendPasswordResetEmail?: (email: string, variant?: AdminEmailVariant) => Promise<void>
  sendVerificationEmail?: (email: string, callbackURL?: string) => Promise<void>
  sendMagicLink?: (email: string, callbackURL?: string) => Promise<void>
  sendWhatsAppNotification?: (payload: WhatsAppNotificationInput) => Promise<void>
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory

// Procedure pubbliche (no auth)
export const publicProcedure = t.procedure

// Procedure protette (qualsiasi utente autenticato)
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, session: ctx.session } })
})

// Procedure solo ADMIN — gate su adminRole != null
// Re-validates from DB on every call to catch revocations immediately
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Fast-path: check context first (most common case)
  if (!ctx.session.user.adminRole) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
  }

  try {
    // Re-check adminRole from DB (not just context) to catch revocations
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { adminRole: true, adminSessionInvalidatedAt: true },
    })

    // User not found in DB or admin role revoked
    if (!user || !user.adminRole) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access denied' })
    }

    // Check if session was invalidated after login (revocation enforcement)
    // Better Auth session record carries the real creation timestamp.
    if (user.adminSessionInvalidatedAt && ctx.session.sessionCreatedAt) {
      if (user.adminSessionInvalidatedAt > ctx.session.sessionCreatedAt) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Session invalidated — re-login required' })
      }
    }
  } catch (err) {
    if (err instanceof TRPCError) throw err
    console.error('[adminProcedure] DB check failed — access denied (fail-closed):', err)
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access check failed' })
  }

  return next({ ctx: { ...ctx, session: ctx.session } })
})

// Procedure solo SUPER_ADMIN
// Re-validates from DB on every call
export const superAdminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Fast-path: check context first (most common case)
  if (ctx.session.user.adminRole !== 'SUPER_ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Super Admin access required' })
  }

  try {
    // Re-check adminRole from DB to catch revocations
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { adminRole: true, adminSessionInvalidatedAt: true },
    })

    // User not found in DB or role changed
    if (!user || user.adminRole !== 'SUPER_ADMIN') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Super Admin access denied' })
    }

    // Check if session was invalidated after login
    if (user.adminSessionInvalidatedAt && ctx.session.sessionCreatedAt) {
      if (user.adminSessionInvalidatedAt > ctx.session.sessionCreatedAt) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Session invalidated — re-login required' })
      }
    }
  } catch (err) {
    if (err instanceof TRPCError) throw err
    console.error('[superAdminProcedure] DB check failed — access denied (fail-closed):', err)
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Super Admin access check failed' })
  }

  return next({ ctx: { ...ctx, session: ctx.session } })
})

// Procedure solo COMPANY
export const companyProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user || ctx.session.user.role !== 'COMPANY') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  requireVerifiedUser(ctx.session)
  return next({ ctx: { ...ctx, session: ctx.session } })
})

// Procedure solo CLIENT
export const clientProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user || ctx.session.user.role !== 'CLIENT') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  requireVerifiedUser(ctx.session)
  return next({ ctx: { ...ctx, session: ctx.session } })
})
