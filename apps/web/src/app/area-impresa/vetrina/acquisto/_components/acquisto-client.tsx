'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Crown, Sparkles, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@fixpro/ui'

type Plan = {
  id: string
  tier: string
  name: string
  description: string | null
  monthlyPriceCents: number
  yearlyPriceCents: number | null
  discountPercent: number
  freeContactsPerMonth: number
  overQuotaDiscountPercent: number
  active: boolean
}

type Props = {
  plans: Plan[]
  currentTier: string | null
}

const TIER_INFO = {
  BASE: {
    icon: Sparkles,
    label: 'Base',
    description: 'Profilo pubblico e visibilità nelle aree base della vetrina. Sconto 33% sui contatti da vetrina.',
    highlight: false,
  },
  PLUS: {
    icon: Zap,
    label: 'Plus',
    description: 'Maggiore visibilità, più placement e profilo arricchito. Sconto 66% sui contatti da vetrina.',
    highlight: true,
  },
  PRO: {
    icon: Crown,
    label: 'Pro',
    description: 'Massima visibilità, placement premium e priorità editoriale. Contatti gratuiti fino alla quota mensile.',
    highlight: false,
  },
} as const

function formatPrice(cents: number) {
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`
}

function PlanCard({
  plan,
  period,
  isCurrent,
}: {
  plan: Plan
  period: 'monthly' | 'yearly'
  isCurrent: boolean
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const info = TIER_INFO[plan.tier as keyof typeof TIER_INFO] ?? TIER_INFO.BASE
  const Icon = info.icon

  const displayPrice =
    period === 'yearly' && plan.yearlyPriceCents
      ? plan.yearlyPriceCents
      : plan.monthlyPriceCents

  async function handleBuy() {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/showcase/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, period }),
      })

      let data: { url?: string; error?: string } | null = null

      try {
        data = await res.json()
      } catch {
        data = null
      }

      if (!res.ok) {
        throw new Error(data?.error || 'CHECKOUT_FAILED')
      }

      if (!data?.url) {
        throw new Error('CHECKOUT_URL_MISSING')
      }

      window.location.href = data.url
    } catch {
      setError('Non siamo riusciti ad avviare il checkout. Riprova tra poco o contatta l’assistenza.')
      setIsSubmitting(false)
    }
  }

  return (
    <Card
      className={
        info.highlight
          ? 'border-primary ring-1 ring-primary/30 relative'
          : isCurrent
            ? 'border-success/30 bg-success/5'
            : ''
      }
    >
      {info.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-0.5 text-[11px] font-semibold">
            <Sparkles className="h-3 w-3 fill-primary-foreground stroke-none" />
            Più popolare
          </span>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 stroke-primary" strokeWidth={1.9} />
          <CardTitle className="text-base">Vetrina {info.label}</CardTitle>
          {isCurrent && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success/10 text-success border border-success/20 px-2 py-0.5 text-[10px] font-semibold">
              Attivo
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <span className="text-3xl font-extrabold text-foreground">
            {formatPrice(displayPrice)}
          </span>
          <span className="text-sm text-muted-foreground">
            {period === 'yearly' ? '/anno' : '/mese'}
          </span>
          {period === 'yearly' && plan.yearlyPriceCents && (
            <p className="text-xs text-success mt-1 font-medium">
              Risparmi {formatPrice(plan.monthlyPriceCents * 12 - plan.yearlyPriceCents)} rispetto al mensile
            </p>
          )}
          {period === 'monthly' && plan.yearlyPriceCents && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatPrice(plan.yearlyPriceCents)}/anno (risparmia {formatPrice(plan.monthlyPriceCents * 12 - plan.yearlyPriceCents)})
            </p>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{info.description}</p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 stroke-success" strokeWidth={2} />
            <span>
              {plan.tier === 'PRO' && plan.freeContactsPerMonth > 0
                ? `${plan.freeContactsPerMonth} contatti vetrina gratuiti/mese`
                : `Sconto ${plan.discountPercent}% sui contatti vetrina`}
            </span>
          </div>
          {plan.tier === 'PRO' && plan.overQuotaDiscountPercent > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 stroke-success" strokeWidth={2} />
              <span>Oltre quota: -{plan.overQuotaDiscountPercent}%</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 stroke-success" strokeWidth={2} />
            <span>Profilo pubblico completo</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 stroke-success" strokeWidth={2} />
            <span>Badge vetrina visibile</span>
          </div>
          {plan.tier !== 'BASE' && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 stroke-success" strokeWidth={2} />
              <span>Maggiore visibilità nei placement</span>
            </div>
          )}
          {plan.tier === 'PRO' && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 stroke-success" strokeWidth={2} />
              <span>Priorità editoriale massima</span>
            </div>
          )}
        </div>

        {isCurrent ? (
          <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-2.5 text-center">
            <p className="text-sm font-medium text-success">Piano attivo</p>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleBuy}
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Reindirizzamento...' : 'Attiva piano'}
            </button>

            {error && (
              <p className="text-xs font-medium text-destructive">
                {error}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function AcquistoClient({ plans, currentTier }: Props) {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('cancelled') === '1'

  const hasYearly = plans.some((p) => p.yearlyPriceCents && p.yearlyPriceCents > 0)

  return (
    <div className="space-y-6">

      {cancelled && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
          <p className="text-sm text-warning font-medium">Pagamento annullato. Nessun addebito effettuato.</p>
        </div>
      )}

      {/* Toggle mensile / annuale */}
      {hasYearly && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPeriod('monthly')}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              period === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Mensile
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              period === 'yearly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Annuale
            <span className="ml-1.5 inline-flex items-center rounded-full bg-success/10 text-success px-1.5 py-0.5 text-[10px] font-semibold border border-success/20">
              Risparmia
            </span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            period={period}
            isCurrent={currentTier === plan.tier}
          />
        ))}
      </div>

    </div>
  )
}
