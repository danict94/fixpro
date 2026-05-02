'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  AlertTriangle,
  Bell,
  Building2,
  CreditCard,
  Headphones,
  LayoutDashboard,
  MessageSquare,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Zap,
} from 'lucide-react'

import { AppShell, AppSidebar } from '@fixpro/ui'
import { authClient } from '@/lib/auth-client'

// NAV
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/area-impresa/dashboard', icon: LayoutDashboard },
  { label: 'Profilo', href: '/area-impresa/profilo', icon: Building2 },
  { label: 'Richieste', href: '/area-impresa/richieste', icon: Zap },
  { label: 'Richieste acquistate', href: '/area-impresa/acquisti', icon: ShoppingBag },
  { label: 'Crediti', href: '/area-impresa/crediti', icon: CreditCard },
  { label: 'Notifiche', href: '/area-impresa/notifiche', icon: Bell },
  { label: 'Contatti', href: '/area-impresa/contatti', icon: MessageSquare },
  { label: 'Assistenza', href: '/area-impresa/assistenza', icon: Headphones },
  { label: 'Rimborsi', href: '/area-impresa/rimborsi', icon: RotateCcw },
  { label: 'Vetrina Premium', href: '/area-impresa/vetrina', icon: Sparkles },
]

interface ImpresaShellProps {
  user: { name: string; email: string; image?: string }
  isProfileComplete: boolean
  unreadNotifCount?: number
  children: React.ReactNode
}

export function ImpresaShell({
  user,
  isProfileComplete,
  unreadNotifCount,
  children,
}: ImpresaShellProps) {
  const pathname = usePathname()

  async function handleLogout() {
    await authClient.signOut()
    window.location.href = '/accedi'
  }

  const navItems = NAV_ITEMS.map((item) =>
    item.href === '/area-impresa/notifiche' && unreadNotifCount && unreadNotifCount > 0
      ? { ...item, badge: unreadNotifCount > 99 ? '99+' : unreadNotifCount }
      : item,
  )

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
      {/* ALERT PROFILO */}
      {!isProfileComplete && (
        <div className="border-b border-warning/20 bg-warning/10">
          <div className="mx-auto flex w-full max-w-[1240px] items-start gap-2 px-5 py-3 sm:px-7 lg:px-8">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 stroke-warning" strokeWidth={2} />
            <p className="text-sm leading-6 text-secondary">
              <span className="font-semibold">Completa il profilo</span> per iniziare a ricevere
              richieste nella tua zona.{' '}
              <Link
                href="/area-impresa/profilo?setup=1"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Configura ora
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* CONTENUTO */}
      <main className="mx-auto w-full max-w-[1240px] px-5 py-5 sm:px-7 md:py-6 lg:px-8">
        {children}
      </main>
    </AppShell>
  )
}