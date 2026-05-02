import { cache } from 'react'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export const getAdminSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  const adminRole = (session?.user as Record<string, unknown>)?.adminRole as string | null

  return {
    session,
    adminRole,
    isSuperAdmin: adminRole === 'SUPER_ADMIN',
  }
})
