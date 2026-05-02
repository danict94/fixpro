import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@fixpro/db'
import { ProfiloCliente } from './_components/profilo-cliente'

export const metadata = { title: 'Il mio profilo' }

export default async function ProfiloClientePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/accedi')

  const user = session.user as Record<string, unknown>
  const phone = (user.phoneNumber as string | null | undefined) ?? null
  const credentialAccount = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: 'credential',
      password: { not: null },
    },
    select: { id: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Il mio profilo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestisci le impostazioni del tuo account.
        </p>
      </div>

      <ProfiloCliente
        name={session.user.name}
        email={session.user.email}
        phone={phone}
        hasPassword={Boolean(credentialAccount)}
      />
    </div>
  )
}
