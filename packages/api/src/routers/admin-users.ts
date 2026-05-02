import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, superAdminProcedure, adminProcedure } from '../trpc'
import * as Sentry from '@sentry/node'
import type { Context } from '../trpc'
import crypto from 'crypto'

function generateIdempotencyKey(action: string, params: Record<string, unknown>): string {
  const payload = `${action}:${JSON.stringify(params)}`
  const secret = process.env.BETTER_AUTH_SECRET || 'fallback-secret'
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

function getPasswordResetSender(ctx: Context) {
  if (!ctx.sendPasswordResetEmail) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Password reset non disponibile in questo contesto',
    })
  }
  return ctx.sendPasswordResetEmail
}

export const adminUsersRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }: { ctx: Context }) => {
    const admins = await ctx.db.user.findMany({
      where: { adminRole: { not: null } },
      select: {
        id: true,
        name: true,
        email: true,
        adminRole: true,
        createdAt: true,
        sessions: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { updatedAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return admins.map((admin: typeof admins[0]) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      adminRole: admin.adminRole,
      invitedAt: admin.createdAt,
      lastLoginAt: admin.sessions[0]?.updatedAt ?? null,
    }))
  }),

  invite: superAdminProcedure
    .input(
      z.object({
        email: z.string().email(),
        adminRole: z.enum(['SUPER_ADMIN', 'ADMIN']),
      }),
    )
    .mutation(async ({ ctx, input }: { ctx: Context; input: { email: string; adminRole: 'SUPER_ADMIN' | 'ADMIN' } }) => {
      if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' })

      const email = input.email.toLowerCase()
      const actorAdminId = ctx.session.user.id
      const sendPasswordResetEmail = getPasswordResetSender(ctx)

      const existing = await ctx.db.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          adminRole: true,
          emailVerified: true,
        },
      })

      const idempotencyKey = generateIdempotencyKey('invite', { email, role: input.adminRole })
      let userId = existing?.id ?? ''
      let inviteStatus: 'invited_new_user' | 'invited_existing_user' | 'access_link_resent' = 'invited_new_user'

      try {
        await ctx.db.$transaction(async (tx) => {
          if (existing) {
            inviteStatus = existing.adminRole === input.adminRole
              ? 'access_link_resent'
              : 'invited_existing_user'

            await tx.user.update({
              where: { id: existing.id },
              data: {
                adminRole: input.adminRole,
                emailVerified: true,
              },
            })

            userId = existing.id
          } else {
            const user = await tx.user.create({
              data: {
                email,
                name: email.split('@')[0] || 'Admin',
                role: 'CLIENT',
                adminRole: input.adminRole,
                emailVerified: true,
              },
            })

            userId = user.id
            inviteStatus = 'invited_new_user'
          }

          await tx.adminAuditLog.create({
              data: {
              adminId: actorAdminId,
              action: 'INVITE_ADMIN',
              targetId: userId,
              targetType: 'User',
              meta: {
                email,
                invitedRole: input.adminRole,
                previousAdminRole: existing?.adminRole ?? null,
                status: inviteStatus,
              },
              idempotencyKey,
            },
          })
        })
      } catch (err) {
        Sentry.captureException(err, { tags: { action: 'invite_admin', phase: 'tx' }, extra: { email } })
        throw err
      }

      try {
        await sendPasswordResetEmail(email, 'invite')
      } catch (emailErr) {
        await ctx.db.$transaction(async (tx) => {
          await tx.adminAuditLog.deleteMany({ where: { idempotencyKey } })

          if (!existing) {
            await tx.user.delete({ where: { id: userId } })
            return
          }

          await tx.user.update({
            where: { id: existing.id },
            data: {
              adminRole: existing.adminRole,
              emailVerified: existing.emailVerified,
            },
          })
        }).catch((compErr) => {
          console.error('[invite] Compensation failed — manual cleanup required:', compErr)
          Sentry.captureException(compErr, {
            tags: { action: 'invite_compensation' },
            extra: { userId, email },
          })
        })

        Sentry.captureException(emailErr, { tags: { action: 'invite_admin', phase: 'email_send' }, extra: { email } })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: "Impossibile inviare l'email di accesso. Riprova più tardi.",
        })
      }

      return { status: inviteStatus, userId }
    }),

  revoke: superAdminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }: { ctx: Context; input: { userId: string } }) => {
      if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' })

      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Non puoi revocare il tuo stesso accesso admin',
        })
      }

      const idempotencyKey = generateIdempotencyKey('revoke', { userId: input.userId })
      const actorAdminId = ctx.session.user.id

      try {
        await ctx.db.$transaction(
          async (tx) => {
            const user = await tx.user.findUnique({
              where: { id: input.userId },
              select: { adminRole: true, email: true },
            })

            if (!user) {
              throw new TRPCError({ code: 'NOT_FOUND', message: 'Admin non trovato' })
            }

            if (user.adminRole === 'SUPER_ADMIN') {
              const superAdminCount = await tx.user.count({ where: { adminRole: 'SUPER_ADMIN' } })
              if (superAdminCount <= 1) {
                throw new TRPCError({
                  code: 'CONFLICT',
                  message: "Non puoi revocare l'unico Super Admin del sistema",
                })
              }
            }

            await tx.user.update({
              where: { id: input.userId },
              data: {
                adminRole: null,
                adminSessionInvalidatedAt: new Date(),
              },
            })

            await tx.session.deleteMany({ where: { userId: input.userId } })

            await tx.adminAuditLog.create({
              data: {
                adminId: actorAdminId,
                action: 'REVOKE_ADMIN',
                targetId: input.userId,
                targetType: 'User',
                meta: { revokedRole: user.adminRole, email: user.email },
                idempotencyKey,
              },
            })
          },
          { isolationLevel: 'Serializable' },
        )

        return { success: true }
      } catch (err) {
        if (err instanceof TRPCError) throw err
        Sentry.captureException(err, { tags: { action: 'revoke_admin' }, extra: { userId: input.userId } })
        throw err
      }
    }),

  changeRole: superAdminProcedure
    .input(z.object({ userId: z.string(), newRole: z.enum(['SUPER_ADMIN', 'ADMIN']) }))
    .mutation(async ({ ctx, input }: { ctx: Context; input: { userId: string; newRole: 'SUPER_ADMIN' | 'ADMIN' } }) => {
      if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' })

      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Non puoi modificare il tuo stesso ruolo' })
      }

      const idempotencyKey = generateIdempotencyKey('changeRole', { userId: input.userId, newRole: input.newRole })
      const actorAdminId = ctx.session.user.id

      try {
        await ctx.db.$transaction(
          async (tx) => {
            const user = await tx.user.findUnique({
              where: { id: input.userId },
              select: { adminRole: true, email: true },
            })

            if (!user) {
              throw new TRPCError({ code: 'NOT_FOUND', message: 'Admin non trovato' })
            }

            const oldRole = user.adminRole

            if (oldRole === 'SUPER_ADMIN' && input.newRole !== 'SUPER_ADMIN') {
              const superAdminCount = await tx.user.count({ where: { adminRole: 'SUPER_ADMIN' } })
              if (superAdminCount <= 1) {
                throw new TRPCError({
                  code: 'CONFLICT',
                  message: "Non puoi declassare l'unico Super Admin del sistema",
                })
              }
            }

            await tx.user.update({
              where: { id: input.userId },
              data: { adminRole: input.newRole, adminSessionInvalidatedAt: new Date() },
            })

            await tx.adminAuditLog.create({
              data: {
                adminId: actorAdminId,
                action: 'CHANGE_ADMIN_ROLE',
                targetId: input.userId,
                targetType: 'User',
                meta: { oldRole, newRole: input.newRole, email: user.email },
                idempotencyKey,
              },
            })
          },
          { isolationLevel: 'Serializable' },
        )

        return { success: true }
      } catch (err) {
        if (err instanceof TRPCError) throw err
        Sentry.captureException(err, { tags: { action: 'change_admin_role' }, extra: { userId: input.userId } })
        throw err
      }
    }),

  logLogin: adminProcedure.mutation(async ({ ctx }: { ctx: Context }) => {
    if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
    try {
      await ctx.db.adminAuditLog.create({
        data: {
          adminId: ctx.session.user.id,
          action: 'LOGIN',
          meta: { email: ctx.session.user.email },
        },
      })
      return { success: true }
    } catch (err) {
      console.error('[Admin logLogin] Failed to log login:', err)
      return { success: false }
    }
  }),

  forceResetPassword: superAdminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }: { ctx: Context; input: { email: string } }) => {
      if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' })

      const email = input.email.toLowerCase()
      const sendPasswordResetEmail = getPasswordResetSender(ctx)

      const user = await ctx.db.user.findUnique({
        where: { email },
        select: { id: true, adminRole: true, email: true },
      })

      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Admin non trovato' })
      if (!user.adminRole) throw new TRPCError({ code: 'FORBIDDEN', message: 'Questo utente non è un amministratore' })
      if (user.email === ctx.session.user.email) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Non puoi forzare il reset password per il tuo stesso account' })
      }

      const idempotencyKey = generateIdempotencyKey('forceResetPassword', { userId: user.id })

      await ctx.db.adminAuditLog.create({
        data: {
          adminId: ctx.session.user.id,
          action: 'FORCE_RESET_PASSWORD',
          targetId: user.id,
          targetType: 'User',
          meta: { email, adminRole: user.adminRole },
          idempotencyKey,
        },
      })

      try {
        await sendPasswordResetEmail(email, 'force-reset')
      } catch (emailErr) {
        console.error('[forceResetPassword] Email send failed:', emailErr)
        Sentry.captureException(emailErr, { tags: { action: 'force_reset_password', phase: 'email_send' }, extra: { email } })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: "Impossibile inviare l'email di reset. Riprova più tardi.",
        })
      }

      return { success: true }
    }),

  listAuditLog: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50), cursor: z.string().optional() }))
    .query(async ({ ctx, input }: { ctx: Context; input: { limit: number; cursor?: string } }) => {
      if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
      const logs = await ctx.db.adminAuditLog.findMany({
        take: input.limit + 1,
        ...(input.cursor && { skip: 1, cursor: { id: input.cursor } }),
        select: {
          id: true,
          adminId: true,
          admin: { select: { name: true, email: true } },
          action: true,
          targetId: true,
          targetType: true,
          meta: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      let nextCursor: string | undefined
      if (logs.length > input.limit) {
        const nextLog = logs.pop()
        nextCursor = nextLog?.id
      }

      return {
        logs: logs.map((log: typeof logs[0]) => ({
          id: log.id,
          adminName: log.admin.name,
          adminEmail: log.admin.email,
          action: log.action,
          targetId: log.targetId,
          targetType: log.targetType,
          meta: log.meta,
          createdAt: log.createdAt,
        })),
        nextCursor,
      }
    }),
})
