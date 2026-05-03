import Link from 'next/link'
import {
  AlertCircle,
  Bath,
  CheckCircle,
  Image as ImageIcon,
  Layers3,
  Ruler,
  Search,
  Sparkles,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  isBathroomContext,
  isPriorityInterventoName,
  isQuantityMetaItem,
  isSurfaceMetaItem,
  parseRequestDescription,
} from '@fixpro/shared'
import { api } from '@/lib/trpc/server'
import { Badge, Card, CardContent } from '@fixpro/ui'

export const metadata = { title: 'Richieste' }

const STATUS_CONFIG = {
  DRAFT: { label: 'Bozza', variant: 'secondary' },
  PENDING: { label: 'In attesa', variant: 'warning' },
  APPROVED: { label: 'Approvata', variant: 'success' },
  REJECTED: { label: 'Rifiutata', variant: 'destructive' },
  FULFILLED: { label: 'Completata', variant: 'success' },
  EXPIRED: { label: 'Scaduta', variant: 'secondary' },
} as const

type RequestStatus = keyof typeof STATUS_CONFIG

type RequestUrgency =
  | 'WITHIN_1_MONTH'
  | 'WITHIN_3_MONTHS'
  | 'WITHIN_6_MONTHS'
  | 'NO_PREFERENCE'

type RequestIntention = 'YES' | 'MAYBE' | 'INFO_ONLY'

type ParsedMetaItem = {
  label: string
  value: string
}

type AdminIntervento = {
  id: string
  nome: string
}

type AdminRequestListItem = {
  id: string
  title: string
  description: string | null
  status: RequestStatus
  urgency: RequestUrgency | null
  intention: RequestIntention | null
  interventoId: string | null
  hasImages: boolean
  city: string | null
  province: string | null
  createdAt: Date | string
  creditCost: number | null
  categoria: {
    nome: string
    settore: {
      nome: string
    }
  }
  client: {
    name: string
    emailVerified: boolean
    phoneNumberVerified: boolean
  }
  targetCompany: {
    ragioneSociale: string
  } | null
  _count: {
    purchases: number
    rescues: number
  }
}

const URGENCY_CONFIG: Record<RequestUrgency, { label: string; className: string }> = {
  WITHIN_1_MONTH: {
    label: 'Urgente',
    className: 'border border-destructive/20 bg-destructive/10 text-destructive',
  },
  WITHIN_3_MONTHS: {
    label: 'Entro 3 mesi',
    className: 'border border-border bg-muted text-muted-foreground',
  },
  WITHIN_6_MONTHS: {
    label: 'Entro 6 mesi',
    className: 'border border-border bg-muted text-muted-foreground',
  },
  NO_PREFERENCE: {
    label: 'Nessuna fretta',
    className: 'border border-border bg-muted text-muted-foreground',
  },
}

const INTENTION_CONFIG: Record<RequestIntention, { label: string; className: string }> = {
  YES: {
    label: 'Pronto a partire',
    className: 'border border-success/20 bg-success/10 text-success',
  },
  MAYBE: {
    label: 'Valutazione',
    className: 'border border-primary/15 bg-primary/10 text-primary',
  },
  INFO_ONLY: {
    label: 'Solo informazioni',
    className: 'border border-border bg-muted text-muted-foreground',
  },
}

const STATUS_TABS = [
  { label: 'Tutte', value: undefined },
  { label: 'In attesa', value: 'PENDING' },
  { label: 'Approvate', value: 'APPROVED' },
  { label: 'Rifiutate', value: 'REJECTED' },
  { label: 'Completate', value: 'FULFILLED' },
  { label: 'Scadute', value: 'EXPIRED' },
] as const

const URGENCY_TABS = [
  { label: 'Qualsiasi urgenza', value: undefined },
  { label: '<= 1 mese', value: 'WITHIN_1_MONTH' },
  { label: '<= 3 mesi', value: 'WITHIN_3_MONTHS' },
] as const

interface Props {
  searchParams: Promise<{
    status?: string
    search?: string
    province?: string
    urgency?: string
  }>
}

function isRequestStatus(value: string | undefined): value is RequestStatus {
  return ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'EXPIRED'].includes(
    value ?? '',
  )
}

function isRequestUrgency(value: string | undefined): value is RequestUrgency {
  return ['WITHIN_1_MONTH', 'WITHIN_3_MONTHS', 'WITHIN_6_MONTHS', 'NO_PREFERENCE'].includes(
    value ?? '',
  )
}

function renderMetaBadge(item: ParsedMetaItem, interventoNome: string | null) {
  const Icon = isSurfaceMetaItem(item)
    ? Ruler
    : isQuantityMetaItem(item) && isBathroomContext(`${interventoNome ?? ''} ${item.value}`)
      ? Bath
      : Layers3

  return (
    <span
      key={`${item.label}-${item.value}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-foreground"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
      {item.value}
    </span>
  )
}

export default async function RichiestePage({ searchParams }: Props) {
  const params = await searchParams

  const validStatus = isRequestStatus(params.status) ? params.status : undefined
  const validUrgency = isRequestUrgency(params.urgency) ? params.urgency : undefined

  const [richiesteResult, interventiResult] = await Promise.all([
    api.admin.requests.list({
      status: validStatus,
      search: params.search || undefined,
      province: params.province || undefined,
      urgency: validUrgency,
    }),
    api.taxonomy.getInterventi(),
  ])

  const richieste = richiesteResult as AdminRequestListItem[]
  const interventi = interventiResult as AdminIntervento[]

  const interventiById = new Map<string, string>(
    interventi.map((intervento: AdminIntervento) => [intervento.id, intervento.nome]),
  )

  function buildHref(overrides: Record<string, string | undefined>) {
    const merged = {
      status: validStatus,
      search: params.search,
      province: params.province,
      urgency: validUrgency,
      ...overrides,
    }

    const qs = Object.entries(merged)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value!)}`)
      .join('&')

    return qs ? `/richieste?${qs}` : '/richieste'
  }

  return (
    <div className="page-section space-y-5 lg:space-y-6">
      <section className="surface-section px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[720px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Moderazione
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-secondary">
              Richieste
            </h1>
            <p className="muted-copy mt-2 text-sm leading-6">
              Controlla lo stato delle richieste, filtra per urgenza o provincia e apri i dettagli
              delle segnalazioni che richiedono revisione.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
              {richieste.length} {richieste.length === 1 ? 'richiesta' : 'richieste'}
            </Badge>

            {params.search && (
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                Ricerca attiva
              </Badge>
            )}
          </div>
        </div>
      </section>

      <section className="surface-section px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold text-secondary">Filtri e ricerca</h2>
            <p className="muted-copy mt-1 text-sm">
              Mantieni il contesto operativo e affina rapidamente il listing senza cambiare flusso
              di moderazione.
            </p>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <form
              method="GET"
              action="/richieste"
              className="flex min-w-0 flex-1 flex-wrap gap-2 xl:max-w-[640px]"
            >
              {validStatus && <input type="hidden" name="status" value={validStatus} />}
              {validUrgency && <input type="hidden" name="urgency" value={validUrgency} />}
              {params.province && <input type="hidden" name="province" value={params.province} />}

              <div className="relative min-w-[220px] flex-1">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 stroke-muted-foreground"
                  strokeWidth={1.8}
                />
                <input
                  type="text"
                  name="search"
                  defaultValue={params.search}
                  placeholder="Cliente o titolo richiesta..."
                  className="flex h-10 w-full rounded-full border border-input bg-background pl-9 pr-4 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <input
                type="text"
                name="province"
                defaultValue={params.province}
                placeholder="Prov."
                maxLength={3}
                className="flex h-10 w-20 rounded-full border border-input bg-background px-4 text-sm uppercase text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              />

              <button type="submit" className="primary-pill h-10 px-4 text-sm font-medium">
                Cerca
              </button>

              {(params.search || params.province) && (
                <Link
                  href={buildHref({ search: undefined, province: undefined })}
                  className="flex h-10 items-center rounded-full border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-secondary"
                >
                  Rimuovi filtri testo
                </Link>
              )}
            </form>

            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => {
                const isActive = validStatus === tab.value

                return (
                  <Link
                    key={tab.label}
                    href={buildHref({ status: tab.value })}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-secondary'
                    }`}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Urgenza
            </p>

            {URGENCY_TABS.map((tab) => {
              const isActive = validUrgency === tab.value

              return (
                <Link
                  key={tab.label}
                  href={buildHref({ urgency: tab.value })}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border border-destructive/30 bg-destructive/10 text-destructive'
                      : 'bg-muted text-muted-foreground hover:text-secondary'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {richieste.length === 0 ? (
        <Card className="surface-card border-0">
          <CardContent className="py-14 text-center">
            <p className="text-base font-medium text-secondary">Nessuna richiesta trovata</p>
            <p className="muted-copy mt-2 text-sm">
              Prova a modificare stato, urgenza o filtri testuali per ampliare i risultati.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-3">
          {richieste.map((r: AdminRequestListItem) => {
            const cfg = STATUS_CONFIG[r.status]
            const urgencyCfg = r.urgency ? URGENCY_CONFIG[r.urgency] : undefined
            const intentionCfg = r.intention ? INTENTION_CONFIG[r.intention] : undefined
            const interventoNome = r.interventoId
              ? interventiById.get(r.interventoId) ?? null
              : null
            const parsedDescription = parseRequestDescription(r.description ?? '')
            const parsedMeta = parsedDescription.meta as ParsedMetaItem[]
            const descriptionText = parsedDescription.description || 'Descrizione non specificata.'
            const isPriorityRequest = isPriorityInterventoName(interventoNome ?? r.title)
            const hasShortDesc = descriptionText.length < 50
            const phoneMissing = !r.client.phoneNumberVerified
            const qualityScore =
              (r.hasImages ? 1 : 0) +
              (r.client.emailVerified ? 1 : 0) +
              (r.client.phoneNumberVerified ? 1 : 0) +
              (r.intention === 'YES' ? 1 : 0) +
              (hasShortDesc ? 0 : 1)
            const hasProblem = phoneMissing || hasShortDesc || qualityScore <= 1

            return (
              <Link key={r.id} href={`/richieste/${r.id}`}>
                <Card
                  className={`surface-card transition-all duration-150 hover:shadow-md ${
                    isPriorityRequest
                      ? 'border-primary/35 bg-primary/[0.04]'
                      : 'border-border/70 bg-card'
                  } ${hasProblem && r.status === 'PENDING' ? 'ring-1 ring-warning/40' : ''}`}
                >
                  <CardContent className="px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="space-y-2">
                          <h2 className="text-lg font-semibold tracking-tight text-secondary">
                            {interventoNome ?? r.title}
                          </h2>

                          {parsedDescription.hasMeta ? (
                            <div className="flex flex-wrap gap-2">
                              {parsedMeta.map((item: ParsedMetaItem) =>
                                renderMetaBadge(item, interventoNome),
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Dimensioni non specificate
                            </p>
                          )}
                        </div>

                        <p className="text-sm leading-6 text-foreground">{descriptionText}</p>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-secondary">
                            {r.categoria.nome}
                          </span>
                          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                            {r.categoria.settore.nome}
                          </span>
                        </div>

                        <p className="text-xs leading-5 text-muted-foreground">
                          {[r.city, r.province].filter(Boolean).join(', ') ||
                            'Localita non specificata'}
                          {' · '}
                          {r.client.name}
                          {' · '}
                          {new Date(r.createdAt).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {' · '}
                          {r._count.purchases} acquisti
                          {r._count.rescues > 0 ? ` · ${r._count.rescues} rescue` : ''}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                          {r.hasImages ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <ImageIcon className="h-3 w-3 stroke-success" strokeWidth={2} />
                              Foto presenti
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <ImageIcon
                                className="h-3 w-3 stroke-muted-foreground"
                                strokeWidth={2}
                              />
                              Nessuna foto
                            </span>
                          )}

                          <span className="text-muted-foreground">·</span>

                          <span
                            className={`inline-flex items-center gap-0.5 ${
                              r.client.emailVerified ? 'text-success' : 'text-muted-foreground'
                            }`}
                            title={
                              r.client.emailVerified ? 'Email verificata' : 'Email non verificata'
                            }
                          >
                            {r.client.emailVerified ? (
                              <CheckCircle className="h-3 w-3 stroke-success" strokeWidth={2} />
                            ) : (
                              <XCircle className="h-3 w-3 stroke-muted-foreground" strokeWidth={2} />
                            )}
                            email
                          </span>

                          <span
                            className={`inline-flex items-center gap-0.5 ${
                              r.client.phoneNumberVerified ? 'text-success' : 'text-destructive'
                            }`}
                            title={
                              r.client.phoneNumberVerified
                                ? 'Telefono verificato'
                                : 'Telefono non verificato'
                            }
                          >
                            {r.client.phoneNumberVerified ? (
                              <CheckCircle className="h-3 w-3 stroke-success" strokeWidth={2} />
                            ) : (
                              <AlertCircle
                                className="h-3 w-3 stroke-destructive"
                                strokeWidth={2}
                              />
                            )}
                            tel
                          </span>

                          {hasShortDesc && (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className="inline-flex items-center gap-0.5 text-warning">
                                <AlertCircle className="h-3 w-3 stroke-warning" strokeWidth={2} />
                                Descrizione breve
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-start gap-2 lg:max-w-[240px] lg:flex-col lg:items-end">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>

                        {urgencyCfg && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${urgencyCfg.className}`}
                          >
                            <Zap className="h-3 w-3" strokeWidth={2} />
                            {urgencyCfg.label}
                          </span>
                        )}

                        {intentionCfg && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${intentionCfg.className}`}
                          >
                            {intentionCfg.label}
                          </span>
                        )}

                        {r.targetCompany && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                            <Sparkles className="h-3 w-3" strokeWidth={2} />
                            Diretta a {r.targetCompany.ragioneSociale}
                          </span>
                        )}

                        {r.creditCost != null && (
                          <span className="text-xs text-muted-foreground">
                            {r.creditCost} cr · EUR{r.creditCost.toFixed(2)}
                          </span>
                        )}

                        <span
                          title={`Qualita lead: ${qualityScore}/5`}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            qualityScore >= 4
                              ? 'bg-success/10 text-success'
                              : qualityScore >= 2
                                ? 'bg-warning/10 text-warning'
                                : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {qualityScore >= 4
                            ? 'Lead completo'
                            : qualityScore >= 2
                              ? 'Lead parziale'
                              : 'Lead incompleto'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </section>
      )}
    </div>
  )
}