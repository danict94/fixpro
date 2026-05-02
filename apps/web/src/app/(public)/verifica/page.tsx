import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@fixpro/db'
import { VerificaClient } from './_components/verifica-client'

export const metadata = {
  title: 'Verifica il tuo account',
}

export default async function VerificaPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/accedi')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      role: true,
      emailVerified: true,
      phoneNumber: true,
      phoneNumberVerified: true,
    },
  })

  if (!user) {
    redirect('/accedi')
  }

  if (user.emailVerified && user.phoneNumberVerified) {
    redirect(user.role === 'COMPANY' ? '/area-impresa/dashboard' : '/area-cliente/richieste')
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <VerificaClient
          email={user.email}
          role={user.role}
          emailVerified={user.emailVerified}
          phoneNumberVerified={user.phoneNumberVerified}
          phoneNumber={user.phoneNumber ?? ''}
        />
      </div>
    </div>
  )
}
