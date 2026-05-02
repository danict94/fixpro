'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Info } from 'lucide-react'
import { Button, Input } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

interface TabAttivitaProps {
  ragioneSociale: string
  partitaIva: string | null
  description: string
  phone: string
  website: string
  workType: 'SMALL' | 'FULL' | 'BOTH'
}

export function TabAttivita({
  ragioneSociale,
  partitaIva,
  description: initialDesc,
  phone,
  website: initialWebsite,
  workType: initialWorkType,
}: TabAttivitaProps) {
  const router = useRouter()
  const [desc, setDesc] = useState(initialDesc)
  const [businessPhone, setBusinessPhone] = useState(phone)
  const [website, setWebsite] = useState(initialWebsite)
  const [workType, setWorkType] = useState(initialWorkType)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const update = trpc.company.updateProfile.useMutation({
    onSuccess: () => {
      setSuccess(true)
      setError(null)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate({
      description: desc.trim() || undefined,
      phone: businessPhone.trim() || undefined,
      website: website.trim() || undefined,
      workType,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="surface-section space-y-3 px-5 py-5 sm:px-6">
        <div className="mb-1 flex items-center gap-2">
          <Info className="h-4 w-4 stroke-muted-foreground" strokeWidth={1.9} />
          <p className="text-sm font-medium text-secondary">Dati anagrafici (non modificabili)</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ragione sociale</p>
            <p className="text-sm font-semibold text-secondary">{ragioneSociale}</p>
          </div>
          {partitaIva && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Partita IVA</p>
              <p className="text-sm font-semibold text-secondary">{partitaIva}</p>
            </div>
          )}
        </div>
      </section>

      <section className="surface-card space-y-5 px-5 py-5 sm:px-6">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary" htmlFor="description">
            Descrizione attività
          </label>
          <p className="text-xs text-muted-foreground">
            Descrivi brevemente la tua attività, i tuoi punti di forza e la tua esperienza (max 1000 caratteri).
          </p>
          <textarea
            id="description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Siamo un'impresa specializzata in..."
            className="w-full resize-none rounded-[22px] border border-border bg-white px-4 py-3 text-sm text-secondary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-right text-xs text-muted-foreground">{desc.length}/1000</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary" htmlFor="businessPhone">
              Telefono aziendale
            </label>
            <Input
              id="businessPhone"
              type="tel"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              placeholder="+39 02 1234567"
              className="rounded-2xl border-border bg-white"
            />
            <p className="text-xs text-muted-foreground">
              Questo numero è visibile ai clienti nel tuo profilo pubblico.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary" htmlFor="website">
              Sito web
            </label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.miaimpresa.it"
              className="rounded-2xl border-border bg-white"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-secondary" htmlFor="workType">
            Tipo di lavori seguiti
          </label>
          <select
            id="workType"
            value={workType}
            onChange={(e) => setWorkType(e.target.value as 'SMALL' | 'FULL' | 'BOTH')}
            className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="BOTH">Sia piccoli interventi che lavori completi</option>
            <option value="SMALL">Soprattutto piccoli interventi</option>
            <option value="FULL">Soprattutto lavori completi / chiavi in mano</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Questa preferenza aiuta il matching a proporti richieste più coerenti con il taglio dei lavori che segui.
          </p>
        </div>
      </section>

      {error && <p className="rounded-[18px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
      {success && <p className="rounded-[18px] border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">Modifiche salvate con successo.</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending} className="primary-pill min-w-36">
          {update.isPending ? 'Salvataggio...' : 'Salva modifiche'}
        </Button>
      </div>
    </form>
  )
}
