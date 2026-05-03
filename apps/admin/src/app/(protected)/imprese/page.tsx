import Link from 'next/link'
import { AlertCircle, CheckCircle, Search, XCircle } from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { Badge, Card, CardContent } from '@fixpro/ui'

export const metadata = { title: 'Imprese' }

const STATUS_CONFIG = {
  PENDING: { label: 'In attesa', variant: 'warning' },
  APPROVED: { label: 'Approvata', variant: 'success' },
  REJECTED: { label: 'Rifiutata', variant: 'destructive' },
  SUSPENDED: { label: 'Sospesa', variant: 'secondary' },
} as const

type CompanyStatus = keyof typeof STATUS_CONFIG

type AdminCompanyListItem = {
  id: string
  ragioneSociale: string
  status: CompanyStatus
  city: string | null
  province: string | null
  createdAt: Date | string
  verified: boolean
  creditBalance: {
    total: number
  } | null
  user: {
    emailVerified: boolean
    phoneNumberVerified: boolean
  }
  categories: Array<{
    categoria: {
      nome: string
    }
  }>
  _count: {
    purchases: number
    rescues: number
  }
}

const STATUS_TABS = [
  { label: 'Tutte', value: undefined },
  { label: 'In attesa', value: 'PENDING' },
  { label: 'Approvate', value: 'APPROVED' },
  { label: 'Rifiutate', value: 'REJECTED' },
  { label: 'Sospese', value: 'SUSPENDED' },
] as const

const CREDITS_FILTERS = [
  { label: 'Tutti', value: undefined },
  { label: '0 crediti', value: 'zero' },
  { label: '< 10', value: 'low' },
  { label: '> 10', value: 'ok' },
] as const

interface Props {
  searchParams: Promise<{
    status?: string
    search?: string
    province?: string
    creditsLevel?: string
  }>
}

export default async function ImpresePage({ searchParams }: Props) {
  const params = await searchParams

  const validStatus = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(
    params.status ?? '',
  )
    ? (params.status as CompanyStatus)
    : undefined

  const validCredits = ['zero', 'low', 'ok'].includes(params.creditsLevel ?? '')
    ? (params.creditsLevel as 'zero' | 'low' | 'ok')
    : undefined

  const imprese = (await api.admin.companies.list({
    status: validStatus,
    search: params.search || undefined,
    province: params.province || undefined,
    creditsLevel: validCredits,
  })) as AdminCompanyListItem[]

  function buildHref(overrides: Record<string, string | undefined>) {
    const merged = {
      status: validStatus,
      search: params.search,
      province: params.province,
      creditsLevel: validCredits ? validCredits : undefined,
      ...overrides,
    }
    const qs = Object.entries(merged)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join('&')
    return qs ? `/imprese?${qs}` : '/imprese'
  }

  return (
    <div className="page-section space-y-5 lg:space-y-6">
      <section className="surface-section px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[720px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Moderazione
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-secondary">Imprese</h1>
            <p className="muted-copy mt-2 text-sm leading-6">
              Controlla stato, crediti, verifiche e segnali di rischio delle imprese registrate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
              {imprese.length} {imprese.length === 1 ? 'impresa' : 'imprese'}
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
              Restringi rapidamente il listing per stato, provincia o livello crediti senza
              cambiare flusso operativo.
            </p>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <form
              method="GET"
              action="/imprese"
              className="flex min-w-0 flex-1 flex-wrap gap-2 xl:max-w-[640px]"
            >
              {validStatus && <input type="hidden" name="status" value={validStatus} />}
              {validCredits && <input type="hidden" name="creditsLevel" value={validCredits} />}
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
                  placeholder="Cerca impresa..."
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
              Crediti
            </p>
            {CREDITS_FILTERS.map((filter) => {
              const isActive = validCredits === filter.value
              return (
                <Link
                  key={filter.label}
                  href={buildHref({ creditsLevel: filter.value })}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border border-warning/30 bg-warning/10 text-warning'
                      : 'bg-muted text-muted-foreground hover:text-secondary'
                  }`}
                >
                  {filter.label}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {imprese.length === 0 ? (
        <Card className="surface-card border-0">
          <CardContent className="py-14 text-center">
            <p className="text-base font-medium text-secondary">Nessuna impresa trovata</p>
            <p className="muted-copy mt-2 text-sm">
              Prova a modificare stato, provincia o livello crediti per ampliare i risultati.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-3">
          {imprese.map((c: AdminCompanyListItem) => {
            const cfg = STATUS_CONFIG[c.status]
            const crediti = c.creditBalance?.total ?? 0
            const categorie = c.categories.map((cc) => cc.categoria.nome).join(', ')
            const openRescues = c._count.rescues
            const hasProblems = crediti === 0 || !c.verified || openRescues >= 3

            return (
              <Link key={c.id} href={`/imprese/${c.id}`}>
                <Card
                  className={`surface-card border-0 transition-shadow duration-150 hover:shadow-md ${
                    hasProblems ? 'ring-warning/40' : ''
                  }`}
                >
                  <CardContent className="px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-secondary">
                            {c.ragioneSociale}
                          </span>
                          <Badge variant={cfg.variant}>
                            {cfg.label}
                          </Badge>

                          {crediti === 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                              <AlertCircle className="h-3 w-3 stroke-destructive" strokeWidth={2} />
                              0 crediti
                            </span>
                          )}
                          {crediti > 0 && crediti <= 10 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                              {crediti} crediti
                            </span>
                          )}
                          {crediti > 10 && (
                            <span className="text-xs text-muted-foreground">{crediti} crediti</span>
                          )}

                          {openRescues >= 3 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                              <AlertCircle className="h-3 w-3 stroke-destructive" strokeWidth={2} />
                              {openRescues} rescue
                            </span>
                          )}
                        </div>

                        <p className="muted-copy text-xs leading-5">
                          {c.city ?? '-'}
                          {c.province ? ` (${c.province})` : ''}
                          {categorie ? ` · ${categorie}` : ''}
                          {' · '}
                          {c._count.purchases} acquisti · {c._count.rescues} rescue
                          {' · '}
                          {new Date(c.createdAt).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            title={
                              c.user.emailVerified ? 'Email verificata' : 'Email non verificata'
                            }
                            className={`inline-flex items-center gap-0.5 text-xs ${
                              c.user.emailVerified ? 'text-success' : 'text-muted-foreground'
                            }`}
                          >
                            {c.user.emailVerified ? (
                              <CheckCircle className="h-3.5 w-3.5 stroke-success" strokeWidth={2} />
                            ) : (
                              <XCircle
                                className="h-3.5 w-3.5 stroke-muted-foreground"
                                strokeWidth={2}
                              />
                            )}
                            <span>email</span>
                          </span>

                          <span
                            title={
                              c.user.phoneNumberVerified
                                ? 'Telefono verificato'
                                : 'Telefono non verificato'
                            }
                            className={`inline-flex items-center gap-0.5 text-xs ${
                              c.user.phoneNumberVerified ? 'text-success' : 'text-muted-foreground'
                            }`}
                          >
                            {c.user.phoneNumberVerified ? (
                              <CheckCircle className="h-3.5 w-3.5 stroke-success" strokeWidth={2} />
                            ) : (
                              <XCircle
                                className="h-3.5 w-3.5 stroke-muted-foreground"
                                strokeWidth={2}
                              />
                            )}
                            <span>tel</span>
                          </span>

                          <span
                            title={c.verified ? 'Impresa verificata' : 'Impresa non verificata'}
                            className={`inline-flex items-center gap-0.5 text-xs ${
                              c.verified ? 'text-success' : 'text-muted-foreground'
                            }`}
                          >
                            {c.verified ? (
                              <CheckCircle className="h-3.5 w-3.5 stroke-success" strokeWidth={2} />
                            ) : (
                              <XCircle
                                className="h-3.5 w-3.5 stroke-muted-foreground"
                                strokeWidth={2}
                              />
                            )}
                            <span>verif.</span>
                          </span>
                        </div>
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