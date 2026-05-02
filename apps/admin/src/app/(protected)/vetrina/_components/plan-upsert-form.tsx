'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Save, Crown, Zap, Sparkles, Wand2 } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

type Tier = 'BASE' | 'PLUS' | 'PRO'

interface PlanData {
  id?:                       string
  tier:                      Tier
  name:                      string
  description:               string
  monthlyPriceCents:         number
  yearlyPriceCents:          number | null
  discountPercent:           number
  freeContactsPerMonth:      number
  overQuotaDiscountPercent:  number
  active:                    boolean
}

// ─── Contenuti professionali predefiniti ─────────────────────────────────────

const PLAN_DEFAULTS: Record<Tier, Omit<PlanData, 'id'>> = {
  BASE: {
    tier:                     'BASE',
    name:                     'Vetrina Base',
    description:              'Inizia a farti trovare. Profilo pubblico completo, badge di verifica e presenza nelle sezioni vetrina. Ogni contatto generato dal tuo profilo costa il 33% in meno rispetto al prezzo standard. Ideale per chi vuole testare la visibilità prima di investire di più.',
    monthlyPriceCents:        2990,
    yearlyPriceCents:         29900,
    discountPercent:          33,
    freeContactsPerMonth:     0,
    overQuotaDiscountPercent: 0,
    active:                   true,
  },
  PLUS: {
    tier:                     'PLUS',
    name:                     'Vetrina Plus',
    description:              'Più visibilità, meno costi. Profilo avanzato con gallery, descrizione estesa e posizionamento prioritario nelle sezioni in evidenza. I contatti provenienti dalla tua vetrina hanno uno sconto del 66% — quasi la metà del costo standard. Il piano ideale per chi vuole distinguersi e ricevere più richieste qualificate.',
    monthlyPriceCents:        4990,
    yearlyPriceCents:         49900,
    discountPercent:          66,
    freeContactsPerMonth:     0,
    overQuotaDiscountPercent: 0,
    active:                   true,
  },
  PRO: {
    tier:                     'PRO',
    name:                     'Vetrina Pro',
    description:              'Massima visibilità, costi minimi. Posizionamento editoriale prioritario in tutte le sezioni della piattaforma. I primi 5 contatti al mese dalla tua vetrina sono completamente gratuiti — poi sconto del 70% su tutti i successivi. Per le imprese che vogliono costruire una presenza digitale solida e generare contatti costanti.',
    monthlyPriceCents:        9990,
    yearlyPriceCents:         99900,
    discountPercent:          0,
    freeContactsPerMonth:     5,
    overQuotaDiscountPercent: 70,
    active:                   true,
  },
}

// ─── Metadati UI per tier ─────────────────────────────────────────────────────

const TIER_META: Record<Tier, { label: string; icon: typeof Sparkles; color: string }> = {
  BASE: { label: 'Base', icon: Sparkles, color: 'stroke-muted-foreground' },
  PLUS: { label: 'Plus', icon: Zap,      color: 'stroke-primary' },
  PRO:  { label: 'Pro',  icon: Crown,    color: 'stroke-warning' },
}

function centsToEuros(cents: number) {
  return (cents / 100).toFixed(2)
}
function eurosToCents(euros: string) {
  return Math.round(parseFloat(euros.replace(',', '.') || '0') * 100)
}

// ─── Form singolo piano ───────────────────────────────────────────────────────

function PlanForm({ plan, onSaved }: { plan: PlanData; onSaved: () => void }) {
  const router = useRouter()
  const [open, setOpen] = useState(!plan.id)

  const [name, setName]         = useState(plan.name)
  const [desc, setDesc]         = useState(plan.description)
  const [monthly, setMonthly]   = useState(centsToEuros(plan.monthlyPriceCents))
  const [yearly, setYearly]     = useState(plan.yearlyPriceCents ? centsToEuros(plan.yearlyPriceCents) : '')
  const [discount, setDiscount] = useState(String(plan.discountPercent))
  const [freeQ, setFreeQ]       = useState(String(plan.freeContactsPerMonth))
  const [overQ, setOverQ]       = useState(String(plan.overQuotaDiscountPercent))
  const [active, setActive]     = useState(plan.active)
  const [error, setError]       = useState<string | null>(null)

  const meta = TIER_META[plan.tier]
  const Icon = meta.icon

  const upsert = trpc.showcase.admin.upsertPlan.useMutation({
    onSuccess: () => {
      setError(null)
      setOpen(false)
      onSaved()
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  function handleSave() {
    upsert.mutate({
      tier:                     plan.tier,
      name:                     name.trim() || PLAN_DEFAULTS[plan.tier].name,
      description:              desc.trim() || undefined,
      monthlyPriceCents:        eurosToCents(monthly),
      yearlyPriceCents:         yearly.trim() ? eurosToCents(yearly) : undefined,
      discountPercent:          parseInt(discount) || 0,
      freeContactsPerMonth:     parseInt(freeQ) || 0,
      overQuotaDiscountPercent: parseInt(overQ) || 0,
      active,
    })
  }

  return (
    <Card className={!plan.id ? 'border-dashed border-muted-foreground/30' : ''}>
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Icon className={`h-4 w-4 ${meta.color}`} strokeWidth={1.9} />
            <CardTitle className="text-sm font-semibold text-foreground">
              Vetrina {meta.label}
            </CardTitle>
            {plan.id
              ? (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {active ? 'Attivo' : 'Inattivo'}
                </span>
              )
              : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
                  Non configurato
                </span>
              )
            }
          </div>
          {open
            ? <ChevronUp className="h-4 w-4 stroke-muted-foreground" strokeWidth={1.9} />
            : <ChevronDown className="h-4 w-4 stroke-muted-foreground" strokeWidth={1.9} />
          }
        </div>

        {!open && plan.id && (
          <p className="text-xs text-muted-foreground mt-1">
            €{centsToEuros(plan.monthlyPriceCents)}/mese
            {plan.yearlyPriceCents && ` · €${centsToEuros(plan.yearlyPriceCents)}/anno`}
            {' · '}
            {plan.tier === 'PRO' && plan.freeContactsPerMonth > 0
              ? `${plan.freeContactsPerMonth} contatti gratuiti/mese, poi -${plan.overQuotaDiscountPercent}%`
              : `-${plan.discountPercent}% sui contatti vetrina`
            }
          </p>
        )}
        {!open && !plan.id && (
          <p className="text-xs text-muted-foreground mt-1">
            Clicca per configurare con le impostazioni consigliate.
          </p>
        )}
      </CardHeader>

      {open && (
        <CardContent className="pt-0 space-y-4">
          <div className="border-t border-border pt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground">Nome piano</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={PLAN_DEFAULTS[plan.tier].name}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground">Descrizione pubblica</label>
              <p className="text-[11px] text-muted-foreground">Mostrata alle imprese nella pagina di acquisto vetrina.</p>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {desc !== PLAN_DEFAULTS[plan.tier].description && (
                <button
                  type="button"
                  onClick={() => setDesc(PLAN_DEFAULTS[plan.tier].description)}
                  className="text-[11px] text-primary hover:underline"
                >
                  ← Ripristina testo consigliato
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Prezzo mensile (€)</label>
              <input
                type="number" min="0" step="0.01"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Prezzo annuale (€) — opzionale</label>
              <input
                type="number" min="0" step="0.01"
                value={yearly}
                onChange={(e) => setYearly(e.target.value)}
                placeholder="Lascia vuoto se non disponibile"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Sconto % contatti vetrina</label>
              <p className="text-[11px] text-muted-foreground">BASE → 33 · PLUS → 66 · PRO → 0 (usa quota)</p>
              <input
                type="number" min="0" max="100"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Contatti gratuiti / mese <span className="text-muted-foreground font-normal">(solo PRO)</span>
              </label>
              <input
                type="number" min="0"
                value={freeQ}
                onChange={(e) => setFreeQ(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 sm:max-w-xs">
              <label className="text-xs font-medium text-foreground">
                Sconto % oltre quota <span className="text-muted-foreground font-normal">(solo PRO)</span>
              </label>
              <input
                type="number" min="0" max="100"
                value={overQ}
                onChange={(e) => setOverQ(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm font-medium text-foreground">
                  Piano attivo — visibile alle imprese nella pagina acquisto
                </span>
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleSave} disabled={upsert.isPending} size="sm" className="gap-1.5">
            <Save className="h-3.5 w-3.5" strokeWidth={2} />
            {upsert.isPending ? 'Salvataggio…' : 'Salva piano'}
          </Button>
        </CardContent>
      )}
    </Card>
  )
}

// ─── Sezione completa con seed rapido ────────────────────────────────────────

export function PlanUpsertSection({
  plans,
}: {
  plans: Array<{
    id:                        string
    tier:                      string
    name:                      string
    description:               string | null
    monthlyPriceCents:         number
    yearlyPriceCents:          number | null
    discountPercent:           number
    freeContactsPerMonth:      number
    overQuotaDiscountPercent:  number
    active:                    boolean
  }>
}) {
  const router = useRouter()
  const [seedError, setSeedError]   = useState<string | null>(null)
  const [seedDone, setSeedDone]     = useState(false)
  const [seedPending, setSeedPending] = useState(false)
  const [, forceUpdate] = useState(0)

  const upsertBase = trpc.showcase.admin.upsertPlan.useMutation()
  const upsertPlus = trpc.showcase.admin.upsertPlan.useMutation()
  const upsertPro  = trpc.showcase.admin.upsertPlan.useMutation()

  const missingTiers = (['BASE', 'PLUS', 'PRO'] as Tier[]).filter(
    (t) => !plans.some((p) => p.tier === t)
  )

  async function handleSeedAll() {
    if (missingTiers.length === 0) return
    setSeedPending(true)
    setSeedError(null)
    try {
      await Promise.all(
        missingTiers.map((tier) => {
          const d = PLAN_DEFAULTS[tier]
          const mutator = tier === 'BASE' ? upsertBase : tier === 'PLUS' ? upsertPlus : upsertPro
          return mutator.mutateAsync({
            tier:                     d.tier,
            name:                     d.name,
            description:              d.description,
            monthlyPriceCents:        d.monthlyPriceCents,
            yearlyPriceCents:         d.yearlyPriceCents ?? undefined,
            discountPercent:          d.discountPercent,
            freeContactsPerMonth:     d.freeContactsPerMonth,
            overQuotaDiscountPercent: d.overQuotaDiscountPercent,
            active:                   d.active,
          })
        })
      )
      setSeedDone(true)
      router.refresh()
    } catch (err: unknown) {
      setSeedError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setSeedPending(false)
    }
  }

  function normalize(tier: Tier): PlanData {
    const existing = plans.find((p) => p.tier === tier)
    if (existing) {
      return {
        id:                       existing.id,
        tier,
        name:                     existing.name,
        description:              existing.description ?? PLAN_DEFAULTS[tier].description,
        monthlyPriceCents:        existing.monthlyPriceCents,
        yearlyPriceCents:         existing.yearlyPriceCents,
        discountPercent:          existing.discountPercent,
        freeContactsPerMonth:     existing.freeContactsPerMonth,
        overQuotaDiscountPercent: existing.overQuotaDiscountPercent,
        active:                   existing.active,
      }
    }
    return { ...PLAN_DEFAULTS[tier] }
  }

  return (
    <div className="space-y-4">

      {/* Banner seed rapido — solo se mancano piani */}
      {missingTiers.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {missingTiers.length === 3
                  ? 'Nessun piano configurato'
                  : `${missingTiers.length} piano${missingTiers.length > 1 ? 'i' : ''} non ancora configurato${missingTiers.length > 1 ? 'i' : ''}`
                }
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Crea tutti e tre i piani in un click con testi, prezzi e sconti già impostati.
                Potrai modificarli in qualsiasi momento.
              </p>
              {seedError && <p className="text-xs text-destructive mt-1">{seedError}</p>}
              {seedDone  && <p className="text-xs text-success mt-1">Piani creati con successo.</p>}
            </div>
            <Button
              onClick={handleSeedAll}
              disabled={seedPending}
              size="sm"
              className="shrink-0 gap-1.5"
            >
              <Wand2 className="h-3.5 w-3.5" strokeWidth={2} />
              {seedPending ? 'Creazione…' : 'Crea piani predefiniti'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Form per ogni tier */}
      <div className="space-y-3">
        {(['BASE', 'PLUS', 'PRO'] as Tier[]).map((tier) => (
          <PlanForm
            key={tier}
            plan={normalize(tier)}
            onSaved={() => forceUpdate((n) => n + 1)}
          />
        ))}
      </div>

    </div>
  )
}
