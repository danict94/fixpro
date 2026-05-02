import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@fixpro/db'
import { ClienteShell } from './_components/cliente-shell'

export default async function AreaClienteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/accedi?redirect=/area-cliente/richieste')
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
    redirect('/accedi?redirect=/area-cliente/richieste')
  }

  if (!user.emailVerified || !user.phoneNumberVerified) {
    redirect('/verifica')
  }

  if (user.role !== 'CLIENT') {
    redirect('/area-impresa/dashboard')
  }

  return (
    <ClienteShell user={{ name: user.name, email: user.email }}>
      {children}
    </ClienteShell>
  )
}
