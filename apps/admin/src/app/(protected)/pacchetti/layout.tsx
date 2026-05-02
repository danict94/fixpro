import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/get-admin-session'

export default async function PacchettiLayout({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin } = await getAdminSession()

  if (!isSuperAdmin) {
    redirect('/unauthorized')
  }

  return <>{children}</>
}
