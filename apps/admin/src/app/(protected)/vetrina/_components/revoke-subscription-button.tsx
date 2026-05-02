'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

export function RevokeSubscriptionButton({
  companyId,
  ragioneSociale,
}: {
  companyId:       string
  ragioneSociale:  string
}) {
  const router          = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const revoke = trpc.showcase.admin.revokeSubscription.useMutation({
    onSuccess: () => {
      setConfirm(false)
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  if (confirm) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-xs text-destructive">Confermi?</span>
        <button
          onClick={() => revoke.mutate({ companyId })}
          disabled={revoke.isPending}
          className="text-xs font-semibold text-destructive hover:underline disabled:opacity-50"
        >
          {revoke.isPending ? '…' : 'Sì, revoca'}
        </button>
        <button
          onClick={() => { setConfirm(false); setError(null) }}
          className="text-xs text-muted-foreground hover:underline"
        >
          Annulla
        </button>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
      title={`Revoca vetrina di ${ragioneSociale}`}
    >
      <XCircle className="h-3.5 w-3.5 stroke-destructive" strokeWidth={2} />
      Revoca
    </button>
  )
}
