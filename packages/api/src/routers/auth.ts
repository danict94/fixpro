import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { AUTH_LOGIN_LIMIT, checkRateLimit } from '../lib/rate-limit'

export const authRouter = createTRPCRouter({
  loginMethod: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase().trim()
      const allowed = await checkRateLimit(`login-method:${email}`, AUTH_LOGIN_LIMIT)

      if (!allowed) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Troppi tentativi. Riprova tra qualche minuto.',
        })
      }

      const user = await ctx.db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          phoneNumberVerified: true,
          accounts: {
            where: { providerId: 'credential' },
            select: { password: true },
          },
        },
      })

      if (!user) {
        return { status: 'not_found' as const, email }
      }

      const hasPassword = user.accounts.some((account) => Boolean(account.password))
      if (hasPassword) {
        return { status: 'password' as const, email }
      }

      const phoneOwnerCount = user.phoneNumber
        ? await ctx.db.user.count({ where: { phoneNumber: user.phoneNumber } })
        : 0

      return {
        status: 'passwordless' as const,
        email,
        canUseSms: Boolean(user.phoneNumber && user.phoneNumberVerified && phoneOwnerCount === 1),
      }
    }),
})
