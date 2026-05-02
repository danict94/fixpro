'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, MessageSquare, Sparkles } from 'lucide-react'
import { Button, Card, CardContent } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

interface Props {
  requestId:          string
  currentStatus:      string
  matchingCount:      number
  byCoords:           boolean
  urgency?:           string
  intention?:         string
  hasImages:          boolean
  targetCompanyName?: string   // se presente = richiesta diretta
}

function suggestPricing(urgency?: string, intention?: string, hasImages?: boolean) {
  let creditCost = 2
  if (urgency === 'WITHIN_1_MONTH')        creditCost = 5
  else if (urgency === 'WITHIN_3_MONTHS')  creditCost = 3
  if (intention === 'YES')  creditCost += 1
  if (hasImages)            creditCost += 1
  creditCost = Math.min(creditCost, 10)
  // one-time suggerito = creditCost * 1.5, arrotondato a 50ct
  const oneTimePriceCents = Math.round((creditCost * 150) / 50) * 50
  return { creditCost, maxBuyers: 3, expiresIn: 30, oneTimePriceCents }
}

export function RichiestaActions({
  requestId,
  currentStatus,
  matchingCount,
  byCoords,
  urgency,
  intention,
  hasImages,
  targetCompanyName,
}: Props) {
  const router = useRouter()
  const suggested = suggestPricing(urgency, intention, hasImages)

  const [mode, setMode]               = useState<'idle' | 'approve' | 'reject' | 'integration'>('idle')
  const [creditCost, setCreditCost]   = useState(suggested.creditCost)
  const [oneTimePriceCents, setOneTimePriceCents] = useState(suggested.oneTimePriceCents)
  const [maxBuyers, setMaxBuyers]     = useState(suggested.maxBuyers)
  const [expiresIn, setExpiresIn]     = useState(suggested.expiresIn)
  const [reason, setReason]           = useState('')
  const [integrationMsg, setIntegrationMsg] = useState('')

  const utils = trpc.useUtils()

  function invalidate() {
    utils.admin.requests.get.invalidate({ id: requestId })
    router.refresh()
    setMode('idle')
  }

  const approve = trpc.admin.requests.approve.useMutation({ onSuccess: invalidate })
  const reject  = trpc.admin.requests.reject.useMutation({ onSuccess: invalidate })
  const requestIntegration = trpc.admin.requests.requestIntegration.useMutation({
    onSuccess: () => {
      setMode('idle')
      setIntegrationMsg('')
    },
  })

  const canApprove = currentStatus === 'PENDING' || currentStatus === 'DRAFT'
  const canReject  = currentStatus === 'PENDING' || currentStatus === 'DRAFT' || currentStatus === 'APPROVED'

  if (!canApprove && !canReject) return null

  function handleApprove(e: React.FormEvent) {
    e.preventDefault()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresIn)
    approve.mutate({ id: requestId, creditCost, oneTimePriceCents, maxBuyers, expiresAt })
  }

  function handleReject(e: React.FormEvent) {
    e.preventDefault()
    reject.mutate({ id: requestId, reason })
  }

  function handleIntegration(e: React.FormEvent) {
    e.preventDefault()
    requestIntegration.mutate({ requestId, message: integrationMsg })
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <p className="font-semibold text-foreground">Azioni</p>

        {/* ── Idle: 3 bottoni ─────────────────────────────────── */}
        {mode === 'idle' && (
          <div className="flex gap-2 flex-wrap">
            {canApprove && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setMode('approve')}
              >
                <CheckCircle className="h-4 w-4 stroke-primary-foreground" strokeWidth={1.8} />
                Approva
              </Button>
            )}
            {canReject && (
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5"
                onClick={() => setMode('reject')}
              >
                <XCircle className="h-4 w-4 stroke-destructive-foreground" strokeWidth={1.8} />
                Rifiuta
              </Button>
            )}
            {canApprove && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setMode('integration')}
              >
                <MessageSquare className="h-4 w-4 stroke-foreground" strokeWidth={1.8} />
                Richiedi integrazione
              </Button>
            )}
          </div>
        )}

        {/* ── Approve form ─────────────────────────────────────── */}
        {mode === 'approve' && (
          <form onSubmit={handleApprove} className="space-y-4">

            {/* Banner richiesta diretta */}
            {targetCompanyName && (
              <div className="flex items-start gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5">
                <Sparkles className="h-4 w-4 shrink-0 stroke-primary mt-0.5" strokeWidth={1.9} />
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-foreground">Richiesta diretta a {targetCompanyName}</p>
                  <p className="text-muted-foreground">
                    Sarà notificata solo questa impresa. Max acquirenti bloccato a 1.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Parametri commerciali</p>
              <p className="text-xs text-muted-foreground">
                Suggeriti automaticamente in base a urgenza, intenzione e immagini.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="creditCost">
                  Crediti (pacchetto)
                </label>
                <input
                  id="creditCost"
                  type="number"
                  min={1}
                  max={100}
                  value={creditCost}
                  onChange={(e) => setCreditCost(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="oneTimePrice">
                  Prezzo one-time (€)
                </label>
                <input
                  id="oneTimePrice"
                  type="number"
                  min={1}
                  step={0.5}
                  value={(oneTimePriceCents / 100).toFixed(2)}
                  onChange={(e) => setOneTimePriceCents(Math.round(parseFloat(e.target.value) * 100))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              {/* Max acquirenti: nascosto per richieste dirette (bloccato a 1 server-side) */}
              {!targetCompanyName && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="maxBuyers">
                    Max acquirenti
                  </label>
                  <input
                    id="maxBuyers"
                    type="number"
                    min={1}
                    max={10}
                    value={maxBuyers}
                    onChange={(e) => setMaxBuyers(Number(e.target.value))}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="expiresIn">
                  Scadenza (giorni)
                </label>
                <input
                  id="expiresIn"
                  type="number"
                  min={7}
                  max={365}
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
            </div>

            <div className="rounded-md bg-muted/40 border border-border px-3 py-2 space-y-1">
              <p className="text-xs text-muted-foreground">
                Costo per impresa:{' '}
                <span className="font-semibold text-foreground">
                  {creditCost} crediti
                </span>
                {' '}oppure{' '}
                <span className="font-semibold text-foreground">
                  €{(oneTimePriceCents / 100).toFixed(2)} one-time
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {targetCompanyName
                  ? <>Notificata solo a <span className="font-semibold text-foreground">{targetCompanyName}</span> (richiesta diretta)</>
                  : <>
                      Raggiungerà{' '}
                      <span className="font-semibold text-foreground">{matchingCount} imprese</span>
                      {matchingCount === 0
                        ? ' (nessuna impresa attiva in questa zona)'
                        : byCoords
                          ? ' nel raggio geografico'
                          : ' nella stessa provincia'}
                    </>
                }
              </p>
            </div>

            {approve.error && (
              <p className="text-sm text-destructive">{approve.error.message}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={approve.isPending}>
                {approve.isPending ? 'Salvataggio…' : 'Conferma approvazione'}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setMode('idle')}>
                Annulla
              </Button>
            </div>
          </form>
        )}

        {/* ── Reject form ──────────────────────────────────────── */}
        {mode === 'reject' && (
          <form onSubmit={handleReject} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="reason">
                Motivazione (visibile al cliente)
              </label>
              <textarea
                id="reason"
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Es. Richiesta incompleta, servizio non disponibile in questa zona…"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            {reject.error && (
              <p className="text-sm text-destructive">{reject.error.message}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" variant="destructive" disabled={reject.isPending}>
                {reject.isPending ? 'Salvataggio…' : 'Conferma rifiuto'}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setMode('idle')}>
                Annulla
              </Button>
            </div>
          </form>
        )}

        {/* ── Integration form ─────────────────────────────────── */}
        {mode === 'integration' && (
          <form onSubmit={handleIntegration} className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Messaggio al cliente</p>
              <p className="text-xs text-muted-foreground">
                La richiesta resta in stato &quot;In attesa&quot;. Il cliente riceverà una notifica con questo messaggio.
              </p>
            </div>
            <textarea
              required
              rows={4}
              value={integrationMsg}
              onChange={(e) => setIntegrationMsg(e.target.value)}
              placeholder="Indica quali informazioni mancano o cosa deve integrare il cliente per procedere con l'approvazione…"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
            {requestIntegration.error && (
              <p className="text-sm text-destructive">{requestIntegration.error.message}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" variant="outline" disabled={requestIntegration.isPending}>
                {requestIntegration.isPending ? 'Invio…' : 'Invia richiesta'}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setMode('idle')}>
                Annulla
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
