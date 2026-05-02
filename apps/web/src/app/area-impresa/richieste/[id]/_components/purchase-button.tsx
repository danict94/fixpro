'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

interface PurchaseButtonProps {
  requestId: string
  creditCost: number
  creditBalance: number
  isFree?: boolean
  disabled?: boolean
  disabledLabel?: string
}

export function PurchaseButton({
  requestId,
  creditCost,
  creditBalance,
  isFree = false,
  disabled = false,
  disabledLabel = 'Richiesta chiusa',
}: PurchaseButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const canAfford = isFree || creditBalance >= creditCost

  const purchase = trpc.requests.purchaseWithCredits.useMutation({
    onSuccess: () => {
      router.refresh()
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  if (!canAfford) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">
          Crediti insufficienti: hai {creditBalance}, servono {creditCost}.
        </p>
        <Link
          href="/area-impresa/crediti"
          className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
        >
          Acquista crediti →
        </Link>
      </div>
    )
  }

  if (disabled) {
    return (
      <div className="space-y-2">
        <Button disabled className="w-full">
          {disabledLabel}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={() => {
          setError(null)
          purchase.mutate({ requestId })
        }}
        disabled={purchase.isPending}
        className="w-full"
      >
        {purchase.isPending ? 'Elaborazione…' : isFree ? 'Sblocca contatto incluso nel tuo piano' : `Acquista con ${creditCost} crediti`}
      </Button>
      {error && <p className="text-center text-xs text-destructive">{error}</p>}
    </div>
  )
}
