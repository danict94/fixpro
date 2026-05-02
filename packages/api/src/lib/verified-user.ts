import { TRPCError } from '@trpc/server'
import type { Context } from '../trpc'

export function requireVerifiedUser(session: Context['session']): asserts session {
  if (!session?.user?.emailVerified) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Verifica la tua email per continuare',
    })
  }

  if (!session.user.phoneNumberVerified) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Verifica il tuo numero di telefono per continuare',
    })
  }
}
