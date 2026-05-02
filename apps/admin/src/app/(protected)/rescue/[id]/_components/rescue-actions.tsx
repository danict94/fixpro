'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { Button, Card, CardContent } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

interface Props {
  rescueId:      string
  currentStatus: string
  creditSpent:   number
  paymentMethod: string
}

export function RescueActions({ rescueId, currentStatus, creditSpent, paymentMethod }: Props) {
  const router = useRouter()
  const [adminNote, setAdminNote] = useState('')

  const updateStatus = trpc.admin.rescue.updateStatus.useMutation({
    onSuccess: () => router.refresh(),
  })

  function handle(status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED') {
    updateStatus.mutate({ id: rescueId, status, adminNote: adminNote || undefined })
  }

  const isDone = currentStatus === 'APPROVED' || currentStatus === 'REJECTED' || currentStatus === 'CLOSED'
  if (isDone) return null

  const approveLabel = paymentMethod === 'CREDITS' && creditSpent > 0
    ? `Approva e rimborsa ${creditSpent} crediti`
    : 'Approva'

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <p className="font-semibold text-foreground">Gestione rescue</p>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="adminNote">
            Nota admin (opzionale)
          </label>
          <textarea
            id="adminNote"
            rows={3}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Note interne o motivazione della decisione…"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {updateStatus.error && (
          <p className="text-sm text-destructive">{updateStatus.error.message}</p>
        )}

        <div className="flex flex-col gap-2">
          {currentStatus === 'OPEN' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handle('UNDER_REVIEW')}
              disabled={updateStatus.isPending}
              className="w-full"
            >
              Prendi in carico
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => handle('APPROVED')}
            disabled={updateStatus.isPending}
            className="w-full"
          >
            {paymentMethod === 'CREDITS' && creditSpent > 0 && (
              <Zap className="mr-1.5 h-3.5 w-3.5 stroke-primary-foreground" strokeWidth={2} />
            )}
            {approveLabel}
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => handle('REJECTED')}
            disabled={updateStatus.isPending}
            className="w-full"
          >
            Rifiuta
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handle('CLOSED')}
            disabled={updateStatus.isPending}
            className="w-full"
          >
            Chiudi senza decisione
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
