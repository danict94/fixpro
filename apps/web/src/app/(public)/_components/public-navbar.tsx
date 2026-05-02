'use client'

import { Navbar } from '@fixpro/ui'
import { authClient } from '@/lib/auth-client'

interface Props {
  userAreaHref?:  string
  userAreaLabel?: string
  creditBalance?: number
}

export function PublicNavbar({ userAreaHref, userAreaLabel, creditBalance }: Props) {
  async function handleSignOut() {
    await authClient.signOut()
    window.location.href = '/'
  }

  return (
    <Navbar
      userAreaHref={userAreaHref}
      userAreaLabel={userAreaLabel}
      creditBalance={creditBalance}
      onSignOut={userAreaHref ? handleSignOut : undefined}
    />
  )
}
