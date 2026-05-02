'use client'

import { useState } from 'react'
import { Button } from '@fixpro/ui'
interface BuyCreditsButtonProps {
  packageId: string
  popular?:  boolean
}

export function BuyCreditsButton({ packageId, popular }: BuyCreditsButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleBuy() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/credits/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ packageId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Errore durante il checkout')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Errore di rete. Riprova.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <Button
        onClick={handleBuy}
        disabled={loading}
        variant={popular ? 'default' : 'outline'}
        className="w-full"
      >
        {loading ? 'Reindirizzamento...' : 'Acquista'}
      </Button>
      {error && <p className="text-center text-xs text-destructive">{error}</p>}
    </div>
  )
}
