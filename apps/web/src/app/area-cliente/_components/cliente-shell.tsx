'use client'

import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  LayoutList,
  User,
  MessageSquare,
  Sparkles,
} from 'lucide-react'

import { AppShell, AppSidebar } from '@fixpro/ui'
import { authClient } from '@/lib/auth-client'

// NAV (pulito, solo navigazione)
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/area-cliente', icon: LayoutDashboard },
  {
    label: 'Le mie richieste',
    href: '/area-cliente/richieste',
    icon: LayoutList,
  },
  {
    label: 'Contatti',
    href: '/area-cliente/contatti',
    icon: MessageSquare,
  },
  {
    label: 'Professionisti',
    href: '/area-cliente/professionisti',
    icon: Sparkles,
  },
  {
    label: 'Il mio profilo',
    href: '/area-cliente/profilo',
    icon: User,
  },
]

interface ClienteShellProps {
  user: {
    name: string
    email: string
    image?: string
  }
  children: React.ReactNode
}

export function ClienteShell({ user, children }: ClienteShellProps) {
  const pathname = usePathname()

  async function handleLogout() {
    try {
      await authClient.signOut()
      window.location.href = '/accedi'
    } catch (error) {
      console.error('Errore durante il logout:', error)
    }
  }

  return (
    <AppShell
      sidebar={
        <AppSidebar
          navItems={NAV_ITEMS}
          currentPath={pathname}
          user={user}
          onLogout={handleLogout}
        />
      }
    >
      <main className="mx-auto w-full max-w-[1240px] px-5 py-5 sm:px-7 md:py-6 lg:px-8">
        {children}
      </main>
    </AppShell>
  )
}