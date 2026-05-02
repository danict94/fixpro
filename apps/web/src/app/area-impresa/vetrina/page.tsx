import Link from 'next/link'
import { api } from '@/lib/trpc/server'
import {
  Card, CardContent, CardHeader, CardTitle,
  Badge,
} from '@fixpro/ui'
import {
  Sparkles, Star, Eye, TrendingUp,
  CheckCircle2, ArrowRight, XCircle,
  ExternalLink, Crown,
} from 'lucide-react'

export const metadata = { title: 'Vetrina Premium' }

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function PlanBadge({ tier }: { tier: string }) {
  if (tier === 'PRO') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
      <Crown className="h-3 w-3 fill-primary-foreground stroke-none" />
      Vetrina Pro
    </span>
  )
  if (tier === 'PLUS') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-xs font-semibold">
      <Sparkles className="h-3 w-3 stroke-secondary-foreground" strokeWidth={2} />
      Vetrina Plus
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground">
      <Sparkles className="h-3 w-3 stroke-foreground" strokeWidth={2} />
      Vetrina Base
    </span>
  )
}

export default async function VetrinaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const success = params.success === '1'
  const canceled = params.cancelled === '1'

  const [status, stats] = await Promise.all([
    api.showcase.company.getStatus(),
    api.showcase.company.getStats(),
  ])

  const { company, isActive } = status
  const sub = company.showcase

  return (
    <div className="space-y-6">
      {success && (
        <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 stroke-success" strokeWidth={2} />
          <p className="text-sm font-medium text-success">
            Pagamento ricevuto. La Vetrina si aggiorna automaticamente non appena Stripe conferma il webhook.
          </p>
        </div>
      )}
      {canceled && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-center gap-2">
          <XCircle className="h-4 w-4 shrink-0 stroke-destructive" strokeWidth={2} />
          <p className="text-sm font-medium text-foreground">Pagamento annullato. Nessuna attivazione è stata eseguita.</p>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vetrina Premium</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aumenta la tua visibilità e ricevi contatti qualificati.
          </p>
        </div>
        {company.slug && (
          <Link
            href={`/impresa/${company.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.9} />
            Anteprima profilo pubblico
          </Link>
        )}
      </div>

      {/* Stato piano */}
      {isActive && sub ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <PlanBadge tier={sub.plan.tier} />
                  <Badge variant="outline" className="text-xs text-success border-success/30 bg-success/10">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Attivo
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{sub.plan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Scade il</p>
                <p className="text-sm font-semibold text-foreground">{formatDate(sub.expiresAt)}</p>
              </div>
            </div>

            <div className="border-t border-primary/10 pt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Vuoi passare a un piano più potente?
              </p>
              <Link
                href="/area-impresa/vetrina/acquisto"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Upgrade
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-primary/30">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-7 w-7 stroke-primary" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">Nessun piano attivo</p>
              <p className="text-sm text-muted-foreground mt-1">
                Attiva la Vetrina Premium per comparire nelle sezioni in evidenza e ricevere contatti qualificati con tariffe agevolate.
              </p>
            </div>
            <Link
              href="/area-impresa/vetrina/acquisto"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="h-4 w-4 fill-primary-foreground stroke-none" />
              Scopri i piani
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Statistiche vetrina */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Eye className="h-5 w-5 stroke-primary" strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalShowcaseContacts}</p>
              <p className="text-xs text-muted-foreground">Contatti da vetrina (totale)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10">
              <TrendingUp className="h-5 w-5 stroke-success" strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.monthShowcaseContacts}</p>
              <p className="text-xs text-muted-foreground">Contatti vetrina questo mese</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/10">
              <Star className="h-5 w-5 stroke-warning" strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.avgRating !== null ? stats.avgRating.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-muted-foreground">
                Rating medio ({stats.reviewCount} recensioni)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cosa include la vetrina */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-medium text-foreground">
            Cosa include la Vetrina Premium
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              'Profilo pubblico completo con logo, cover e gallery',
              'Comparsa nelle sezioni "Professionisti in evidenza"',
              'Recensioni pubbliche verificate collegate ad acquisti reali',
              'Tariffe agevolate sui contatti generati dalla vetrina',
              'Badge vetrina visibile nel profilo',
              'Statistiche di visibilità e contatti ricevuti',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 stroke-success mt-0.5" strokeWidth={2} />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>

          {!isActive && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link
                href="/area-impresa/vetrina/acquisto"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Confronta i piani e attiva la vetrina
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gestione profilo pubblico */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-medium text-foreground">
            Profilo pubblico
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Il tuo profilo pubblico viene generato automaticamente dai dati del tuo account.
            Puoi arricchirlo con una descrizione estesa, logo, cover e gallery di lavori.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/area-impresa/profilo?tab=media"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Gestisci media profilo
              <ArrowRight className="h-3.5 w-3.5 stroke-muted-foreground" strokeWidth={1.9} />
            </Link>
            {company.slug && (
              <Link
                href={`/impresa/${company.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Vedi profilo pubblico
                <ExternalLink className="h-3.5 w-3.5 stroke-muted-foreground" strokeWidth={1.9} />
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
