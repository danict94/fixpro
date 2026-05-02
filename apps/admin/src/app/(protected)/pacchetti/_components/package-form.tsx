'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

interface PackageFormProps {
  pkg?: {
    id:          string
    name:        string
    credits:     number
    priceCents:  number
    validityMonths: number
    description: string | null
    popular:     boolean
    active:      boolean
    sortOrder:   number
  }
  onDone: () => void
}

export function PackageForm({ pkg, onDone }: PackageFormProps) {
  const router = useRouter()

  const [name,        setName]        = useState(pkg?.name        ?? '')
  const [credits,     setCredits]     = useState(String(pkg?.credits     ?? 10))
  const [priceEuros,  setPriceEuros]  = useState(pkg ? String((pkg.priceCents / 100).toFixed(2)) : '')
  const [validityMonths, setValidityMonths] = useState(String(pkg?.validityMonths ?? 12))
  const [description, setDescription] = useState(pkg?.description ?? '')
  const [popular,     setPopular]     = useState(pkg?.popular     ?? false)
  const [sortOrder,   setSortOrder]   = useState(String(pkg?.sortOrder   ?? 0))
  const [error,       setError]       = useState<string | null>(null)

  const upsert = trpc.admin.packages.upsert.useMutation({
    onSuccess: () => { router.refresh(); onDone() },
    onError:   (e) => setError(e.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const priceCents = Math.round(parseFloat(priceEuros) * 100)
    if (isNaN(priceCents) || priceCents <= 0) {
      setError('Prezzo non valido')
      return
    }
    const parsedValidityMonths = parseInt(validityMonths, 10)
    if (!Number.isFinite(parsedValidityMonths) || parsedValidityMonths <= 0) {
      setError('Validità non valida')
      return
    }
    upsert.mutate({
      id:          pkg?.id,
      name:        name.trim(),
      credits:     parseInt(credits, 10),
      priceCents,
      validityMonths: parsedValidityMonths,
      description: description.trim() || undefined,
      popular,
      active:      pkg?.active ?? true,
      sortOrder:   parseInt(sortOrder, 10) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Starter" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Crediti</label>
          <Input type="number" min={1} value={credits} onChange={(e) => setCredits(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Prezzo (€)</label>
          <Input type="number" min={0.01} step={0.01} value={priceEuros} onChange={(e) => setPriceEuros(e.target.value)} placeholder="es. 9.00" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Validità (mesi)</label>
          <Input type="number" min={1} max={120} value={validityMonths} onChange={(e) => setValidityMonths(e.target.value)} required />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Descrizione</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="es. Ideale per iniziare" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Ordine</label>
          <Input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id="popular"
            checked={popular}
            onChange={(e) => setPopular(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <label htmlFor="popular" className="text-sm text-foreground">Più popolare</label>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={upsert.isPending} size="sm">
          {upsert.isPending ? 'Salvataggio…' : pkg ? 'Aggiorna' : 'Crea pacchetto'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Annulla
        </Button>
      </div>
    </form>
  )
}
