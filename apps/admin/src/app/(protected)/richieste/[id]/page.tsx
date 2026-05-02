import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Sparkles, Users } from 'lucide-react'
import { parseRequestDescription } from '@fixpro/shared'
import { api } from '@/lib/trpc/server'
import { Badge, Card, CardContent } from '@fixpro/ui'
import { RichiestaActions } from './_components/richiesta-actions'

const STATUS_CONFIG = {
  DRAFT: { label: 'Bozza', variant: 'secondary' },
  PENDING: { label: 'In attesa', variant: 'warning' },
  APPROVED: { label: 'Approvata', variant: 'success' },
  REJECTED: { label: 'Rifiutata', variant: 'destructive' },
  FULFILLED: { label: 'Completata', variant: 'success' },
  EXPIRED: { label: 'Scaduta', variant: 'secondary' },
} as const

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  RESIDENTIAL: 'Residenziale',
  COMMERCIAL: 'Commerciale',
}

const URGENCY_LABEL: Record<string, string> = {
  WITHIN_1_MONTH: 'Entro 1 mese',
  WITHIN_3_MONTHS: 'Entro 3 mesi',
  WITHIN_6_MONTHS: 'Entro 6 mesi',
  NO_PREFERENCE: 'Nessuna preferenza',
}

const INTENTION_LABEL: Record<string, string> = {
  YES: 'Si, sicuramente',
  MAYBE: 'Forse, sto valutando',
  INFO_ONLY: 'Solo informazioni',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function RichiestaDetailPage({ params }: Props) {
  const { id } = await params

  let richiesta: Awaited<ReturnType<typeof api.admin.requests.get>>
  let matching: Awaited<ReturnType<typeof api.admin.requests.matchingCompanies>>

  try {
    ;[richiesta, matching] = await Promise.all([
      api.admin.requests.get({ id }),
      api.admin.requests.matchingCompanies({ requestId: id }),
    ])
  } catch {
    notFound()
  }

  const interventi = await api.taxonomy.getInterventi()
  const interventoNome =
    interventi.find((intervento) => intervento.id === richiesta.interventoId)?.nome ?? null
  const parsedDescription = parseRequestDescription(richiesta.description)
  const location = [richiesta.city, richiesta.province].filter(Boolean).join(', ')
  const headingTitle = interventoNome
    ? location
      ? `${interventoNome} — ${location}`
      : interventoNome
    : richiesta.title

  const cfg =
    STATUS_CONFIG[richiesta.status as keyof typeof STATUS_CONFIG] ??
    { label: richiesta.status, variant: 'secondary' as const }

  return (
    <div className="space-y-6">
      <Link
        href="/richieste"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 stroke-current" strokeWidth={1.8} />
        Tutte le richieste
      </Link>

      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-foreground">{headingTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {interventoNome
              ? `${richiesta.categoria.nome} · ${richiesta.categoria.settore.nome}`
              : `${richiesta.categoria.settore.nome} · ${richiesta.categoria.nome}`}
            {richiesta.servizio ? ` · ${richiesta.servizio.nome}` : ''}
          </p>
        </div>
        <Badge variant={cfg.variant as 'secondary' | 'success' | 'warning' | 'destructive'}>
          {cfg.label}
        </Badge>
      </div>

      {richiesta.status === 'PENDING' &&
        (richiesta.targetCompany ? (
          <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
            <Sparkles className="h-4 w-4 shrink-0 stroke-primary" strokeWidth={1.8} />
            <span className="text-muted-foreground">
              Richiesta diretta a{' '}
              <span className="font-semibold text-foreground">
                {richiesta.targetCompany.ragioneSociale}
              </span>
              {richiesta.targetCompany.slug && (
                <>
                  {' '}
                  —{' '}
                  <Link
                    href={`/imprese/${richiesta.targetCompany.slug}`}
                    className="underline hover:text-foreground"
                  >
                    vedi profilo
                  </Link>
                </>
              )}
              . Se approvata, sara notificata solo questa impresa.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <Users className="h-4 w-4 shrink-0 stroke-muted-foreground" strokeWidth={1.8} />
            <span className="text-muted-foreground">
              Se approvata, raggiungera{' '}
              <span className="font-semibold text-foreground">{matching.total} imprese</span>
              {matching.total === 0
                ? ' (nessuna impresa attiva in questa zona)'
                : matching.byCoords
                  ? ' nel raggio geografico impostato'
                  : ' nella stessa provincia'}
            </span>
          </div>
        ))}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-6">
              <p className="font-semibold text-foreground">Descrizione</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {parsedDescription.description}
              </p>

              {parsedDescription.hasMeta && (
                <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Dimensioni lavoro
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {parsedDescription.meta.map((item) => (
                      <span
                        key={`${item.label}-${item.value}`}
                        className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground"
                      >
                        {item.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="mb-4 font-semibold text-foreground">Dettagli</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Settore</dt>
                <dd className="text-foreground">{richiesta.categoria.settore.nome}</dd>

                <dt className="text-muted-foreground">Intervento</dt>
                <dd className="text-foreground">{interventoNome ?? 'Non specificato'}</dd>

                <dt className="text-muted-foreground">Categoria</dt>
                <dd className="text-foreground">{richiesta.categoria.nome}</dd>

                {richiesta.servizio && (
                  <>
                    <dt className="text-muted-foreground">Servizio</dt>
                    <dd className="text-foreground">{richiesta.servizio.nome}</dd>
                  </>
                )}

                {richiesta.propertyType && (
                  <>
                    <dt className="text-muted-foreground">Tipo immobile</dt>
                    <dd className="text-foreground">
                      {PROPERTY_TYPE_LABEL[richiesta.propertyType] ?? richiesta.propertyType}
                    </dd>
                  </>
                )}

                {richiesta.urgency && (
                  <>
                    <dt className="text-muted-foreground">Urgenza</dt>
                    <dd className="text-foreground">
                      {URGENCY_LABEL[richiesta.urgency] ?? richiesta.urgency}
                    </dd>
                  </>
                )}

                {richiesta.intention && (
                  <>
                    <dt className="text-muted-foreground">Intenzione</dt>
                    <dd className="text-foreground">
                      {INTENTION_LABEL[richiesta.intention] ?? richiesta.intention}
                    </dd>
                  </>
                )}

                <dt className="text-muted-foreground">Immagini allegate</dt>
                <dd className="text-foreground">{richiesta.hasImages ? 'Si' : 'No'}</dd>

                {richiesta.address && (
                  <>
                    <dt className="text-muted-foreground">Indirizzo</dt>
                    <dd className="text-foreground">
                      {richiesta.address}
                      {richiesta.streetNumber ? ` ${richiesta.streetNumber}` : ''}
                      {richiesta.city ? `, ${richiesta.city}` : ''}
                      {richiesta.province ? ` (${richiesta.province})` : ''}
                      {richiesta.cap ? ` — ${richiesta.cap}` : ''}
                    </dd>
                  </>
                )}

                <dt className="text-muted-foreground">Creata il</dt>
                <dd className="text-foreground">
                  {new Date(richiesta.createdAt).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>

                {richiesta.approvedAt && (
                  <>
                    <dt className="text-muted-foreground">Approvata il</dt>
                    <dd className="text-foreground">
                      {new Date(richiesta.approvedAt).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </dd>
                  </>
                )}

                {richiesta.creditCost != null && (
                  <>
                    <dt className="text-muted-foreground">Costo crediti</dt>
                    <dd className="text-foreground">
                      {richiesta.creditCost} crediti · €{richiesta.creditCost.toFixed(2)}
                    </dd>
                  </>
                )}

                {richiesta.maxBuyers != null && (
                  <>
                    <dt className="text-muted-foreground">Max acquirenti</dt>
                    <dd className="text-foreground">{richiesta.maxBuyers}</dd>
                  </>
                )}

                {richiesta.expiresAt && (
                  <>
                    <dt className="text-muted-foreground">Scade il</dt>
                    <dd className="text-foreground">
                      {new Date(richiesta.expiresAt).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </dd>
                  </>
                )}

                {richiesta.rejectedReason && (
                  <>
                    <dt className="text-muted-foreground">Motivo rifiuto</dt>
                    <dd className="text-foreground">{richiesta.rejectedReason}</dd>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          {richiesta.purchases.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <p className="mb-4 font-semibold text-foreground">
                  Acquisti ({richiesta.purchases.length})
                </p>
                <div className="space-y-2">
                  {richiesta.purchases.map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{purchase.company.ragioneSociale}</span>
                      <span className="text-muted-foreground">
                        {purchase.company.city} · {purchase.creditSpent} crediti ·{' '}
                        {new Date(purchase.purchasedAt).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="mb-3 font-semibold text-foreground">Cliente</p>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">{richiesta.client.name}</p>
                <p className="text-muted-foreground">{richiesta.client.email}</p>
                {richiesta.client.phoneNumber && (
                  <p className="text-muted-foreground">{richiesta.client.phoneNumber}</p>
                )}
                {(richiesta.contactName ?? richiesta.contactPhone) && (
                  <div className="mt-2 border-t border-border pt-2">
                    <p className="mb-1 text-xs text-muted-foreground">Contatto fornito</p>
                    {richiesta.contactName && (
                      <p className="text-foreground">
                        {richiesta.contactName} {richiesta.contactSurname ?? ''}
                      </p>
                    )}
                    {richiesta.contactPhone && (
                      <p className="text-muted-foreground">{richiesta.contactPhone}</p>
                    )}
                    {richiesta.contactEmail && (
                      <p className="text-muted-foreground">{richiesta.contactEmail}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <RichiestaActions
            requestId={richiesta.id}
            currentStatus={richiesta.status}
            matchingCount={matching.total}
            byCoords={matching.byCoords}
            urgency={richiesta.urgency ?? undefined}
            intention={richiesta.intention ?? undefined}
            hasImages={richiesta.hasImages}
            targetCompanyName={richiesta.targetCompany?.ragioneSociale ?? undefined}
          />
        </div>
      </div>
    </div>
  )
}
