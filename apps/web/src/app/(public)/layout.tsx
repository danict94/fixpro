import { headers } from 'next/headers'
import { Footer } from '@fixpro/ui'
import { auth } from '@/lib/auth'
import { prisma } from '@fixpro/db'
import { PublicNavbar } from './_components/public-navbar'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  const dbUser = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          role: true,
          emailVerified: true,
          phoneNumberVerified: true,
        },
      })
    : null

  const role = dbUser?.role
  const emailVerified = dbUser?.emailVerified ?? false
  const phoneNumberVerified = dbUser?.phoneNumberVerified ?? false
  const isFullyVerified = emailVerified && phoneNumberVerified

  const userAreaHref = !session?.user
    ? undefined
    : !isFullyVerified
      ? '/verifica'
      : role === 'COMPANY'
        ? '/area-impresa/dashboard'
        : role === 'CLIENT'
          ? '/area-cliente'
          : undefined

  const userAreaLabel = !session?.user
    ? undefined
    : !isFullyVerified
      ? 'Verifica account'
      : role === 'COMPANY'
        ? 'Area Impresa'
        : role === 'CLIENT'
          ? 'Area Cliente'
          : undefined

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicNavbar
        userAreaHref={userAreaHref}
        userAreaLabel={userAreaLabel}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}