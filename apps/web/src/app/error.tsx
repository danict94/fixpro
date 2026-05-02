'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@fixpro/ui'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Si è verificato un errore</h1>
        <p className="text-sm text-muted-foreground">
          {error.message || 'Si è verificato un errore inatteso. Riprova o torna alla home.'}
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Button variant="outline" onClick={reset}>
            Riprova
          </Button>
          <Link href="/" className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 ease-[ease] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 h-10 px-4 py-2 text-sm">
            Torna alla home
          </Link>
        </div>
      </div>
    </div>
  )
}
