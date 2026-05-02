import { redirect } from 'next/navigation'
import { prisma } from '@fixpro/db'
import { AdminShell } from './_components/admin-shell'
import { getAdminSession } from '@/lib/get-admin-session'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { session, adminRole } = await getAdminSession()

  if (!session?.user) redirect('/accedi')
  if (!adminRole) redirect('/unauthorized')

  let pendingRequests = 0
  let pendingCompanies = 0
  let openRescues = 0
  let unreadAssistenza = 0

  try {
    const results = await Promise.race([
      Promise.all([
        prisma.serviceRequest.count({ where: { status: 'PENDING' } }),
        prisma.company.count({ where: { status: 'PENDING' } }),
        prisma.rescue.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
        prisma.assistanceMessage.count({ where: { senderType: 'COMPANY', readAt: null } }),
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB timeout')), 3000)
      ),
    ])
    ;[pendingRequests, pendingCompanies, openRescues, unreadAssistenza] = results
  } catch (err) {
    // DB timeout o errore: usa fallback (0), layout renderizza comunque
    console.error('[ProtectedLayout] Badge counts timeout/error:', err)
  }

  return (
    <AdminShell
      user={{ name: session.user.name, email: session.user.email }}
      adminRole={adminRole as 'SUPER_ADMIN' | 'ADMIN'}
      badgeCounts={{ pendingRequests, pendingCompanies, openRescues, unreadAssistenza }}
    >
      {children}
    </AdminShell>
  )
}
