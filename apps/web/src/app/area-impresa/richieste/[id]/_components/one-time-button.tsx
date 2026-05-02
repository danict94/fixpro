'use client'

import { useState } from 'react'
import { Button } from '@fixpro/ui'

interface OneTimePurchaseButtonProps {
  requestId: string
  amountCents: number
  disabled?: boolean
  disabledLabel?: string
}

export function OneTimePurchaseButton({
  requestId,
  amountCents,
  disabled = false,
  disabledLabel = 'Richiesta chiusa',
}: OneTimePurchaseButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/requests/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
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

  const price = `€${(amountCents / 100).toFixed(2).replace('.', ',')}`

  return (
    <div className="space-y-1.5">
      <Button
        variant="outline"
        onClick={handleCheckout}
        disabled={loading || disabled}
        className="w-full"
      >
        {disabled ? disabledLabel : loading ? 'Reindirizzamento…' : `Paga ${price} una tantum`}
      </Button>
      {error && <p className="text-center text-xs text-destructive">{error}</p>}
    </div>
  )
}
