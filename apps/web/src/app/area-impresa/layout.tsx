import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@fixpro/db'
import { ImpresaShell } from './_components/impresa-shell'

export default async function AreaImpresaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/accedi?redirect=/area-impresa/dashboard')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      phoneNumberVerified: true,
    },
  })

  if (!user) {
    redirect('/accedi?redirect=/area-impresa/dashboard')
  }

  if (!user.emailVerified || !user.phoneNumberVerified) {
    redirect('/verifica')
  }

  if (user.role !== 'COMPANY') {
    redirect('/area-cliente')
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      city: true,
      categories: { select: { categoriaId: true } },
    },
  })

  if (!company) {
    redirect('/registrati')
  }

  const isProfileComplete = company.categories.length > 0 && company.city !== null

  const unreadNotifCount = await prisma.notification.count({
    where: { userId: session.user.id, channel: 'IN_APP', readAt: null },
  })

  return (
    <ImpresaShell
      user={{ name: user.name, email: user.email }}
      isProfileComplete={isProfileComplete}
      unreadNotifCount={unreadNotifCount}
    >
      {children}
    </ImpresaShell>
  )
}