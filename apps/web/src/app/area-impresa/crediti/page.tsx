import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { CheckCircle, XCircle, CreditCard, TrendingDown, TrendingUp, Clock } from 'lucide-react'
import { auth } from '@/lib/auth'
import { api } from '@/lib/trpc/server'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@fixpro/ui'
import { BuyCreditsButton } from './_components/buy-credits-button'

type CreditFulfillmentStatus =
  | 'processed'
  | 'already_processed'
  | 'pending_payment'
  | 'pending_capture'
  | 'pending_webhook'
  | 'voided'
  | 'ignored'

type CreditFulfillmentResult = {
  ok: boolean
  processed: boolean
  status: CreditFulfillmentStatus
}

async function getCreditFulfillmentResult(
  sessionId: string,
  cookieHeader: string,
  host: string | null,
  proto: string | null,
): Promise<CreditFulfillmentResult | null> {
  const baseUrl = process.env.BETTER_AUTH_URL ?? (host ? `${proto ?? 'http'}://${host}` : null)

  if (!baseUrl) {
    return null
  }

  try {
    const response = await fetch(`${baseUrl}/api/credits/fulfill`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify({ sessionId }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return response.json() as Promise<CreditFulfillmentResult>
  } catch {
    return null
  }
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateFull(d: Date) {
  return new Date(d).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function daysUntil(d: Date) {
  const ms = new Date(d).getTime() - Date.now()
  return Math.ceil(ms / 86_400_000)
}

function getSuccessBanner(fulfillment: CreditFulfillmentResult | null) {
  if (fulfillment?.status === 'processed' || fulfillment?.status === 'already_processed') {
    return {
      icon: CheckCircle,
      className: 'border-success/30 bg-success/10',
      iconClassName: 'stroke-success',
      message: 'Pagamento confermato. I crediti sono stati accreditati correttamente.',
    }
  }

  if (fulfillment?.status === 'voided') {
    return {
      icon: XCircle,
      className: 'border-destructive/30 bg-destructive/10',
      iconClassName: 'stroke-destructive',
      message:
        'Pagamento non completato. Nessun addebito definitivo è stato acquisito e i crediti non sono stati attivati.',
    }
  }

  return {
    icon: Clock,
    className: 'border-warning/30 bg-warning/10',
    iconClassName: 'stroke-warning',
    message:
      fulfillment?.status === 'pending_payment'
        ? 'Pagamento in attesa. Stiamo verificando la conferma finale da Stripe.'
        : fulfillment?.status === 'pending_capture'
          ? 'Pagamento autorizzato. Stiamo completando la cattura e l’accredito dei crediti.'
          : "Pagamento registrato. L'accredito dei crediti è ancora in verifica.",
  }
}

export default async function CreditiPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; session_id?: string }>
}) {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session?.user) redirect('/accedi')

  const params = await searchParams
  const success = params.success === '1'
  const canceled = params.canceled === '1'

  const fulfillment =
    success && params.session_id
      ? await getCreditFulfillmentResult(
          params.session_id,
          requestHeaders.get('cookie') ?? '',
          requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host'),
          requestHeaders.get('x-forwarded-proto'),
        )
      : null

  const successBanner = success ? getSuccessBanner(fulfillment) : null

  const [{ total, batches, movements }, packages] = await Promise.all([
    api.credits.getBalance(),
    api.credits.listPackages(),
  ])

  return (
    <div className="page-section space-y-8 lg:space-y-10">
      <section className="app-page-header">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[760px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Area impresa
            </p>
            <h1 className="section-title mt-3 text-secondary">Crediti</h1>
            <p className="muted-copy mt-3 text-sm leading-6 sm:text-[15px]">
              Gestisci il saldo disponibile, acquista nuovi pacchetti e controlla scadenze e
              movimenti senza uscire dall&apos;area finanziaria.
            </p>
          </div>

          <div className="rounded-full border border-primary/20 bg-white px-4 py-2.5 shadow-sm ring-1 ring-border/60">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 stroke-primary" strokeWidth={1.9} />
              <span className="text-2xl font-semibold text-primary">{total}</span>
              <span className="text-sm text-muted-foreground">crediti disponibili</span>
            </div>
          </div>
        </div>
      </section>

      {successBanner && (
        <section className={`surface-card flex items-start gap-3 border px-4 py-4 ${successBanner.className}`}>
          <successBanner.icon
            className={`mt-0.5 h-5 w-5 shrink-0 ${successBanner.iconClassName}`}
            strokeWidth={1.9}
          />
          <p className="text-sm font-medium leading-6 text-secondary">{successBanner.message}</p>
        </section>
      )}

      {canceled && (
        <section className="surface-card flex items-start gap-3 border border-destructive/30 bg-destructive/10 px-4 py-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 stroke-destructive" strokeWidth={1.9} />
          <p className="text-sm font-medium leading-6 text-secondary">
            Pagamento annullato. Nessun addebito è stato effettuato.
          </p>
        </section>
      )}

      <section className="surface-section px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-secondary">Acquista crediti</h2>
            <p className="muted-copy mt-1 text-sm">
              Scegli il pacchetto più adatto alla tua operatività e mantieni sempre disponibile il
              saldo necessario per sbloccare i contatti.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {packages.length === 0 && (
            <div className="feature-panel col-span-full px-6 py-8 text-center">
              <p className="text-base font-medium text-secondary">
                Nessun pacchetto disponibile al momento
              </p>
              <p className="muted-copy mt-2 text-sm">
                Torna più tardi per visualizzare nuove opzioni di acquisto.
              </p>
            </div>
          )}

          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`surface-card border-0 hover:shadow-sm ${
                pkg.popular ? 'ring-primary/25' : ''
              }`}
            >
              <CardHeader className="space-y-3 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base text-secondary">{pkg.name}</CardTitle>
                  {pkg.popular && (
                    <Badge className="shrink-0 rounded-full bg-primary text-primary-foreground text-xs">
                      Più popolare
                    </Badge>
                  )}
                </div>
                <p className="muted-copy text-sm leading-6">{pkg.description}</p>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-end gap-2">
                    <span className="text-3xl font-semibold text-secondary">
                      EUR{(pkg.priceCents / 100).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="muted-copy text-sm">{pkg.credits} crediti</span>
                  </div>
                  <p className="muted-copy text-xs">
                    ~EUR{((pkg.priceCents / 100) / pkg.credits).toFixed(2).replace('.', ',')} per
                    credito · Validità {pkg.validityMonths} mesi
                  </p>
                </div>

                <BuyCreditsButton packageId={pkg.id} popular={pkg.popular} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {batches.length > 0 && (
        <section className="surface-section px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-secondary">Pacchetti attivi</h2>
              <p className="muted-copy mt-1 text-sm">
                Controlla crediti residui, totale acquistato e date di scadenza dei batch ancora in
                uso.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-[22px] ring-1 ring-border/60">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Crediti rimanenti
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Totale</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Scadenza
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stato</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {batches.map((b) => {
                  const days = daysUntil(b.expiresAt)

                  return (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-semibold text-secondary">{b.remaining}</td>
                      <td className="px-4 py-3 text-muted-foreground">{b.amount}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateFull(b.expiresAt)}
                      </td>
                      <td className="px-4 py-3">
                        {days <= 30 ? (
                          <div className="flex items-center gap-1.5 text-warning">
                            <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                            <span className="text-xs font-medium">Scade tra {days} giorni</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Attivo</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {movements.length > 0 && (
        <section className="surface-section px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-secondary">Storico movimenti</h2>
              <p className="muted-copy mt-1 text-sm">
                Verifica acquisti e utilizzi con saldo risultante e data del movimento.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-[22px] ring-1 ring-border/60">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nota</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Crediti
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Saldo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {movements.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {m.type === 'PURCHASE' ? (
                          <TrendingUp
                            className="h-3.5 w-3.5 shrink-0 stroke-success"
                            strokeWidth={2}
                          />
                        ) : (
                          <TrendingDown
                            className="h-3.5 w-3.5 shrink-0 stroke-destructive"
                            strokeWidth={2}
                          />
                        )}
                        <span className="text-xs font-medium capitalize text-muted-foreground">
                          {m.type === 'PURCHASE' ? 'Acquisto' : 'Utilizzo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.note ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={m.amount > 0 ? 'text-success' : 'text-destructive'}>
                        {m.amount > 0 ? '+' : ''}
                        {m.amount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {m.balanceAfter}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(m.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {movements.length === 0 && batches.length === 0 && (
        <section className="feature-panel px-6 py-10 sm:px-8">
          <div className="mx-auto flex max-w-[520px] flex-col items-center justify-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border/60">
              <CreditCard className="h-8 w-8 stroke-primary" strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-secondary">Nessun credito ancora</p>
              <p className="muted-copy max-w-sm text-sm leading-6">
                Acquista un pacchetto per iniziare a sbloccare i contatti dei clienti.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}