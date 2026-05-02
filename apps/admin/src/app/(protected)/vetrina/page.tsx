import Link from 'next/link'
import { Sparkles, CheckCircle2, XCircle, Crown, Zap, ExternalLink } from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { Card, CardContent, Badge } from '@fixpro/ui'
import { PlanUpsertSection } from './_components/plan-upsert-form'
import { AssignSubscriptionForm } from './_components/assign-subscription-form'
import { RevokeSubscriptionButton } from './_components/revoke-subscription-button'

export const metadata = { title: 'Vetrina Premium' }

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function TierBadge({ tier }: { tier: string }) {
  if (tier === 'PRO')  return (
    <Badge variant="default" className="text-xs gap-1">
      <Crown className="h-3 w-3 fill-primary-foreground stroke-none" />Pro
    </Badge>
  )
  if (tier === 'PLUS') return (
    <Badge variant="secondary" className="text-xs gap-1">
      <Zap className="h-3 w-3 stroke-secondary-foreground" strokeWidth={2} />Plus
    </Badge>
  )
  return (
    <Badge variant="outline" className="text-xs gap-1">
      <Sparkles className="h-3 w-3 stroke-foreground" strokeWidth={2} />Base
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE')    return <Badge className="bg-success/10 text-success border-success/20 text-xs">Attivo</Badge>
  if (status === 'EXPIRED')   return <Badge variant="destructive" className="text-xs">Scaduto</Badge>
  if (status === 'CANCELLED') return <Badge variant="outline" className="text-xs text-muted-foreground">Cancellato</Badge>
  return null
}

export default async function AdminVetrinaPage() {
  const [plans, subscriptions] = await Promise.all([
    api.showcase.admin.listPlans(),
    api.showcase.admin.listSubscriptions({ take: 100 }),
  ])

  const activeCount  = subscriptions.filter((s) => s.status === 'ACTIVE').length
  const expiredCount = subscriptions.filter((s) => s.status === 'EXPIRED').length

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-foreground">Vetrina Premium</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configura i piani, assegna subscription alle imprese e monitora le attivazioni.
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-5 w-5 stroke-success" strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Subscription attive</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-5 w-5 stroke-destructive" strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{expiredCount}</p>
              <p className="text-xs text-muted-foreground">Scadute</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <Sparkles className="h-5 w-5 stroke-muted-foreground" strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{plans.length}/3</p>
              <p className="text-xs text-muted-foreground">Piani configurati</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Piani ─────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Piani vetrina</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Crea o modifica i tre piani (BASE / PLUS / PRO). Clicca su un piano per espandere il form.
          </p>
        </div>
        <PlanUpsertSection plans={plans} />
      </section>

      {/* ── Assegna subscription ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Assegna subscription</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cerca un&apos;impresa e assegnale un piano vetrina per N mesi. Utile per trial, promozioni o test.
            {plans.length === 0 && (
              <span className="text-warning font-medium"> ⚠ Configura almeno un piano prima di assegnare.</span>
            )}
          </p>
        </div>
        <AssignSubscriptionForm />
      </section>

      {/* ── Subscription attive ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Subscription imprese</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {subscriptions.length} subscription totali — {activeCount} attive.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            {subscriptions.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Nessuna subscription. Usa il form sopra per assegnare un piano a un&apos;impresa.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {sub.company.ragioneSociale}
                        </p>
                        {sub.company.verified && (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 stroke-success" strokeWidth={2} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Scade: {formatDate(sub.expiresAt)}
                      </p>
                    </div>

                    <TierBadge tier={sub.plan.tier} />
                    <StatusBadge status={sub.status} />

                    <Link
                      href={`/imprese/${sub.company.id}`}
                      className="shrink-0 text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" strokeWidth={1.9} />
                      Profilo
                    </Link>

                    {sub.status === 'ACTIVE' && (
                      <RevokeSubscriptionButton
                        companyId={sub.company.id}
                        ragioneSociale={sub.company.ragioneSociale}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

    </div>
  )
}
