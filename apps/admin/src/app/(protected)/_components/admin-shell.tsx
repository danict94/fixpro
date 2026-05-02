'use client'

import { usePathname } from 'next/navigation'
import {
  Building2,
  FileText,
  Headphones,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Shield,
  Sparkles,
} from 'lucide-react'

import { AppShell, AppSidebar } from '@fixpro/ui'
import { authClient } from '@/lib/auth-client'

// NAV BASE
const BASE_NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Richieste', href: '/richieste', icon: FileText },
  { label: 'Imprese', href: '/imprese', icon: Building2 },
  { label: 'Rescue', href: '/rescue', icon: LifeBuoy },
  { label: 'Assistenza', href: '/assistenza', icon: Headphones },
]

// NAV SUPER ADMIN
const SUPER_ADMIN_ITEMS = [
  { label: 'Pacchetti', href: '/pacchetti', icon: Package },
  { label: 'Vetrina', href: '/vetrina', icon: Sparkles },
  { label: 'Amministratori', href: '/admins', icon: Shield },
]

interface BadgeCounts {
  pendingRequests: number
  pendingCompanies: number
  openRescues: number
  unreadAssistenza: number
}

interface AdminShellProps {
  user: { name: string; email: string }
  adminRole: 'SUPER_ADMIN' | 'ADMIN'
  children: React.ReactNode
  badgeCounts?: BadgeCounts
}

export function AdminShell({
  user,
  adminRole,
  children,
  badgeCounts,
}: AdminShellProps) {
  const pathname = usePathname() ?? '/'

  async function handleLogout() {
    await authClient.signOut()
    window.location.href = '/accedi'
  }

  const badgeMap: Record<string, number> = {
    '/richieste': badgeCounts?.pendingRequests ?? 0,
    '/imprese': badgeCounts?.pendingCompanies ?? 0,
    '/rescue': badgeCounts?.openRescues ?? 0,
    '/assistenza': badgeCounts?.unreadAssistenza ?? 0,
  }

  const allNavItems =
    adminRole === 'SUPER_ADMIN'
      ? [...BASE_NAV_ITEMS, ...SUPER_ADMIN_ITEMS]
      : BASE_NAV_ITEMS

  const navItems = allNavItems.map((item) => {
    const count = badgeMap[item.href] ?? 0
    if (count === 0) return item
    return { ...item, badge: count > 99 ? '99+' : count }
  })

  return (
    <AppShell
      sidebar={
        <AppSidebar
          navItems={navItems}
          currentPath={pathname}
          user={user}
          onLogout={handleLogout}
        />
      }
    >
      <main className="mx-auto w-full max-w-[1240px] px-5 py-4 sm:px-7 md:py-5 lg:px-8">
        {children}
      </main>
    </AppShell>
  )
}