'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRequestDisplayTitle } from '@fixpro/shared'
import { Button, cn } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

const STANDARD_REASONS = [
  {
    id:    'no_response',
    label: 'Il cliente non risponde',
    text:  'Ho tentato di contattare il cliente sia via telefono che via email, ma non ho ricevuto risposta. Non è stato possibile avviare un preventivo o un sopralluogo.',
  },
  {
    id:    'wrong_contacts',
    label: 'Dati di contatto errati',
    text:  'I dati di contatto forniti (telefono e/o email) risultano errati o inesistenti. Non è stato possibile raggiungere il cliente.',
  },
  {
    id:    'already_assigned',
    label: 'Lavoro già assegnato',
    text:  "Il cliente ha comunicato di aver già affidato il lavoro a un'altra impresa prima che potessi presentare un preventivo.",
  },
  {
    id:    'request_mismatch',
    label: 'Richiesta non corrispondente',
    text:  "La richiesta effettiva del cliente non corrisponde a quanto descritto nell'annuncio. Il lavoro riguarda un'area o tipologia di intervento diversa da quella pubblicata.",
  },
  {
    id:    'duplicate',
    label: 'Richiesta duplicata o non reale',
    text:  "La richiesta appare essere un duplicato o non corrisponde a un'esigenza reale del cliente.",
  },
  {
    id:    'other',
    label: 'Altro motivo',
    text:  '',
  },
] as const

interface EligiblePurchase {
  id:        string
  requestId: string
  request: {
    title:     string
    city:      string | null
    province:  string | null
    intervento: { nome: string } | null
    categoria: { nome: string }
  }
}

interface Props {
  purchases:        EligiblePurchase[]
  defaultRequestId?: string
}

export function OpenRescueForm({ purchases, defaultRequestId }: Props) {
  const router = useRouter()
  const [open,           setOpen]           = useState(!!defaultRequestId)
  const [requestId,      setRequestId]      = useState(defaultRequestId ?? '')
  const [reason,         setReason]         = useState('')
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [error,          setError]          = useState<string | null>(null)

  const openRescue = trpc.rescues.open.useMutation({
    onSuccess: () => {
      setOpen(false)
      setRequestId('')
      setReason('')
      setSelectedReason('')
      setError(null)
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  function selectPreset(id: string, text: string) {
    setSelectedReason(id)
    setReason(text)
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={purchases.length === 0}
      >
        {purchases.length === 0 ? 'Nessun acquisto eleggibile' : 'Apri rimborso'}
      </Button>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-5 w-full">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Richiesta di rimborso</h3>
        <button
          onClick={() => { setOpen(false); setError(null) }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Annulla
        </button>
      </div>

      {/* Selezione richiesta */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Richiesta acquistata <span className="text-destructive">*</span>
        </label>
        {defaultRequestId ? (
          /* Richiesta fissa — arriva dal link nella pagina dettaglio */
          (() => {
            const fixed = purchases.find((p) => p.requestId === defaultRequestId)
            const fixedTitle = fixed
              ? formatRequestDisplayTitle({
                  title: fixed.request.title,
                  interventoNome: fixed.request.intervento?.nome,
                  city: fixed.request.city,
                  province: fixed.request.province,
                })
              : ''
            return fixed ? (
              <div className="flex items-center justify-between rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">
                <span className="text-foreground">
                  {fixedTitle}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  #{fixed.requestId.slice(-8).toUpperCase()}
                </span>
              </div>
            ) : (
              <p className="text-sm text-destructive">Richiesta non trovata tra gli acquisti eleggibili.</p>
            )
          })()
        ) : (
          <select
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seleziona una richiesta…</option>
            {purchases.map((p) => (
              <option key={p.id} value={p.requestId}>
                {formatRequestDisplayTitle({
                  title: p.request.title,
                  interventoNome: p.request.intervento?.nome,
                  city: p.request.city,
                  province: p.request.province,
                })} — {p.request.categoria.nome}
                {' '}(#{p.requestId.slice(-8).toUpperCase()})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Motivazioni predefinite */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Motivo del rimborso <span className="text-destructive">*</span></label>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {STANDARD_REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => selectPreset(r.id, r.text)}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-left text-sm transition-colors duration-150',
                selectedReason === r.id
                  ? 'border-primary bg-primary/5 font-medium text-primary'
                  : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/40',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Testo libero */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Descrizione dettagliata</label>
        <p className="text-xs text-muted-foreground">
          {selectedReason ? 'Puoi modificare il testo suggerito.' : 'Seleziona un motivo sopra o scrivi direttamente.'}
        </p>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            // Se l'utente modifica il testo, deseleziona il preset
            if (selectedReason && e.target.value !== STANDARD_REASONS.find(r => r.id === selectedReason)?.text) {
              setSelectedReason('other')
            }
          }}
          placeholder="Descrivi il problema riscontrato con questa richiesta…"
          rows={4}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-right text-xs text-muted-foreground">{reason.length}/2000</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={() => {
          setError(null)
          openRescue.mutate({ requestId, reason })
        }}
        disabled={openRescue.isPending || !requestId || reason.trim().length < 20}
        className="w-full"
      >
        {openRescue.isPending ? 'Invio in corso…' : 'Invia richiesta di rimborso'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Il team FixPro verificherà la richiesta entro 2 giorni lavorativi.
      </p>
    </div>
  )
}
