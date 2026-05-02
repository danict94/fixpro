'use client'

import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useState } from 'react'

export default function UnauthorizedPage() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await authClient.signOut({ fetchOptions: { onSuccess: () => router.push('/accedi') } })
    } catch (err) {
      console.error('Logout failed:', err)
      router.push('/accedi')
    }
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="page-container flex min-h-screen items-center justify-center py-10">
        <div className="surface-card w-full max-w-md px-6 py-8 sm:px-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <span className="text-sm font-semibold text-warning">403</span>
          </div>
          <h1 className="text-2xl font-semibold text-secondary">Accesso negato</h1>
          <p className="muted-copy mt-2 text-sm leading-6">
            Non hai i permessi per accedere al pannello amministrativo.
          </p>
          <div className="mt-6 space-y-2.5">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="primary-pill w-full px-5 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {loggingOut ? 'Disconnessione...' : 'Accedi con altro account'}
            </button>
            <button
              onClick={() => router.push('/accedi')}
              disabled={loggingOut}
              className="inline-flex w-full items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold text-secondary transition duration-150 hover:bg-muted disabled:opacity-50"
            >
              Torna al login
            </button>
          </div>
          <p className="muted-copy mt-4 text-xs leading-5">
            Se ritieni sia un errore, contatta un amministratore con privilegi adeguati.
          </p>
        </div>
      </div>
    </div>
  )
}
