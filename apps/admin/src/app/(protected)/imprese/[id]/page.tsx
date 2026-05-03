import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle, Monitor, XCircle } from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { Badge, Card, CardContent } from '@fixpro/ui'
import { ImpresaActions } from './_components/impresa-actions'

const STATUS_CONFIG = {
  PENDING: { label: 'In attesa', variant: 'warning' },
  APPROVED: { label: 'Approvata', variant: 'success' },
  REJECTED: { label: 'Rifiutata', variant: 'destructive' },
  SUSPENDED: { label: 'Sospesa', variant: 'secondary' },
} as const

type CompanyStatus = keyof typeof STATUS_CONFIG

const MOVEMENT_TYPE: Record<string, string> = {
  PURCHASE: 'Acquisto pacchetto',
  SPEND: 'Spesa lead',
  REFUND: 'Rimborso rescue',
  BONUS: 'Bonus admin',
  EXPIRY: 'Scadenza batch',
}

type CompanyCategory = {
  categoria: {
    nome: string
    settore: {
      nome: string
    }
  }
}

type CompanySession = {
  id: string
  userAgent: string | null
  ipAddress: string | null
  createdAt: Date | string
  expiresAt: Date | string
}

type CompanyCreditMovement = {
  id: string
  type: string
  note: string | null
  amount: number
  balanceAfter: number
}

type CompanyCreditBatch = {
  id: string
  amount: number
  remaining: number
  expiresAt: Date | string
}

type CompanyPurchase = {
  id: string
  creditSpent: number
  purchasedAt: Date | string
  request: {
    id: string
    title: string
    city: string | null
  }
}

type CompanyRescue = {
  id: string
  status: string
  reason: string
  createdAt: Date | string
}

function VerifyBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-sm ${ok ? 'text-success' : 'text-muted-foreground'}`}>
      {ok ? (
        <CheckCircle className="h-4 w-4 stroke-success" strokeWidth={2} />
      ) : (
        <XCircle className="h-4 w-4 stroke-muted-foreground" strokeWidth={2} />
      )}
      <span>{label}</span>
    </div>
  )
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ImpresaDetailPage({ params }: Props) {
  const { id } = await params

  let company: Awaited<ReturnType<typeof api.admin.companies.get>>

  try {
    company = await api.admin.companies.get({ id })
  } catch {
    notFound()
  }

  const companyStatus = company.status as CompanyStatus
  const cfg = STATUS_CONFIG[companyStatus]

  const categories = company.categories as CompanyCategory[]
  const sessions = company.user.sessions as CompanySession[]
  const creditMovements = company.creditMovements as CompanyCreditMovement[]
  const creditBatches = company.creditBatches as CompanyCreditBatch[]
  const purchases = company.purchases as CompanyPurchase[]
  const rescues = company.rescues as CompanyRescue[]

  const crediti = company.creditBalance?.total ?? 0
  const openRescues = rescues.filter(
    (r) => r.status === 'OPEN' || r.status === 'UNDER_REVIEW',
  ).length

  return (
    <div className="space-y-6">
      <Link
        href="/imprese"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 stroke-current" strokeWidth={1.8} />
        Tutte le imprese
      </Link>

      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-foreground">{company.ragioneSociale}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {company.city ?? '—'}
            {company.province ? ` (${company.province})` : ''}
            {' · '}
            {company.user.email}
          </p>
        </div>

        <Badge variant={cfg.variant}>
          {cfg.label}
        </Badge>
      </div>

      {/* Banner sospensione */}
      {company.status === 'SUSPENDED' && company.suspendedReason && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <span className="font-medium text-warning">Motivo sospensione: </span>
          <span className="text-foreground">{company.suspendedReason}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonna principale */}
        <div className="space-y-4 lg:col-span-2">
          {/* Dati aziendali */}
          <Card>
            <CardContent className="p-6">
              <p className="mb-4 font-semibold text-foreground">Dati aziendali</p>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {company.partitaIva && (
                  <>
                    <dt className="text-muted-foreground">P.IVA</dt>
                    <dd className="text-foreground">{company.partitaIva}</dd>
                  </>
                )}

                {company.phone && (
                  <>
                    <dt className="text-muted-foreground">Telefono</dt>
                    <dd className="text-foreground">{company.phone}</dd>
                  </>
                )}

                {company.user.phoneNumber && (
                  <>
                    <dt className="text-muted-foreground">Tel. utente</dt>
                    <dd className="text-foreground">{company.user.phoneNumber}</dd>
                  </>
                )}

                {company.website && (
                  <>
                    <dt className="text-muted-foreground">Sito web</dt>
                    <dd className="text-foreground">{company.website}</dd>
                  </>
                )}

                {(company.city || company.province || company.cap) && (
                  <>
                    <dt className="text-muted-foreground">Città</dt>
                    <dd className="text-foreground">
                      {company.city ?? '—'}
                      {company.cap ? ` ${company.cap}` : ''}
                      {company.province ? ` (${company.province})` : ''}
                    </dd>
                  </>
                )}

                {company.address && (
                  <>
                    <dt className="text-muted-foreground">Indirizzo</dt>
                    <dd className="text-foreground">{company.address}</dd>
                  </>
                )}

                <dt className="text-muted-foreground">Raggio copertura</dt>
                <dd className="text-foreground">{company.radiusKm} km</dd>

                <dt className="text-muted-foreground">Categorie</dt>
                <dd className="text-foreground">
                  {categories
                    .map((cc) => `${cc.categoria.settore.nome} / ${cc.categoria.nome}`)
                    .join(', ') || '—'}
                </dd>

                <dt className="text-muted-foreground">Registrata il</dt>
                <dd className="text-foreground">
                  {new Date(company.createdAt).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>

                {company.description && (
                  <>
                    <dt className="text-muted-foreground">Descrizione</dt>
                    <dd className="text-foreground">{company.description}</dd>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Verifica account */}
          <Card>
            <CardContent className="p-6">
              <p className="mb-4 font-semibold text-foreground">Verifica account</p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <VerifyBadge ok={company.user.emailVerified} label="Email verificata" />
                <VerifyBadge ok={company.user.phoneNumberVerified} label="Telefono verificato" />
                <VerifyBadge ok={company.verified} label="Impresa verificata" />
              </div>

              {!company.verified && (
                <p className="mt-3 text-xs text-muted-foreground">
                  L&apos;impresa non è ancora stata verificata manualmente. Usa il pulsante
                  &quot;Segna come verificata&quot; nelle azioni a destra.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sessioni recenti */}
          {sessions.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <p className="mb-4 font-semibold text-foreground">Sessioni recenti</p>

                <div className="space-y-3">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-start gap-3 text-sm">
                      <Monitor
                        className="mt-0.5 h-4 w-4 shrink-0 stroke-muted-foreground"
                        strokeWidth={1.8}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-foreground">{s.userAgent ?? 'User agent sconosciuto'}</p>
                        <p className="text-xs text-muted-foreground">
                          IP: {s.ipAddress ?? '—'} ·{' '}
                          {new Date(s.createdAt).toLocaleString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {new Date(s.expiresAt) < new Date() && ' · Scaduta'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Movimenti crediti */}
          {creditMovements.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold text-foreground">Movimenti crediti</p>
                  <span className="text-sm font-semibold text-foreground">Saldo: {crediti}</span>
                </div>

                <div className="space-y-2">
                  {creditMovements.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <span className="text-foreground">{MOVEMENT_TYPE[m.type] ?? m.type}</span>
                        {m.note && <span className="text-muted-foreground"> — {m.note}</span>}
                      </div>

                      <div className="ml-4 shrink-0 text-right">
                        <span className={`font-medium ${m.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                          {m.amount > 0 ? '+' : ''}
                          {m.amount}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">→ {m.balanceAfter}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Batch crediti attivi */}
          {creditBatches.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <p className="mb-4 font-semibold text-foreground">Batch crediti</p>

                <div className="space-y-2">
                  {creditBatches.map((b) => {
                    const expired = new Date(b.expiresAt) < new Date()

                    return (
                      <div key={b.id} className="flex items-center justify-between text-sm">
                        <span className={expired ? 'text-muted-foreground line-through' : 'text-foreground'}>
                          {b.remaining}/{b.amount} crediti rimasti
                        </span>

                        <span className={`text-xs ${expired ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {expired ? 'Scaduto ' : 'Scade '}
                          {new Date(b.expiresAt).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ultimi acquisti */}
          {purchases.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <p className="mb-4 font-semibold text-foreground">
                  Acquisti recenti ({purchases.length})
                </p>

                <div className="space-y-2">
                  {purchases.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <Link
                        href={`/richieste/${p.request.id}`}
                        className="text-foreground transition-colors hover:text-primary"
                      >
                        {p.request.title}
                        {p.request.city ? ` · ${p.request.city}` : ''}
                      </Link>

                      <span className="ml-4 shrink-0 text-muted-foreground">
                        {p.creditSpent} crediti ·{' '}
                        {new Date(p.purchasedAt).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rescue */}
          {rescues.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <p className="mb-4 font-semibold text-foreground">
                  Rescue ({rescues.length})
                  {openRescues > 0 && (
                    <span className="ml-2 text-xs font-normal text-warning">
                      {openRescues} aperti
                    </span>
                  )}
                </p>

                <div className="space-y-2">
                  {rescues.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <Link
                        href={`/rescue/${r.id}`}
                        className="max-w-[60%] truncate text-foreground transition-colors hover:text-primary"
                      >
                        {r.reason.substring(0, 60)}
                        {r.reason.length > 60 ? '…' : ''}
                      </Link>

                      <span
                        className={`ml-4 shrink-0 text-xs ${
                          r.status === 'OPEN' || r.status === 'UNDER_REVIEW'
                            ? 'text-warning'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {r.status === 'OPEN'
                          ? 'Aperto'
                          : r.status === 'UNDER_REVIEW'
                            ? 'In revisione'
                            : r.status === 'APPROVED'
                              ? 'Approvato'
                              : r.status === 'REJECTED'
                                ? 'Rifiutato'
                                : 'Chiuso'}
                        {' · '}
                        {new Date(r.createdAt).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonna destra */}
        <div className="space-y-4">
          {/* Riepilogo */}
          <Card>
            <CardContent className="space-y-2 p-6">
              <p className="font-semibold text-foreground">Riepilogo</p>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Crediti disponibili</span>
                <span
                  className={`font-semibold ${
                    crediti === 0
                      ? 'text-destructive'
                      : crediti <= 10
                        ? 'text-warning'
                        : 'text-foreground'
                  }`}
                >
                  {crediti}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Acquisti totali</span>
                <span className="text-foreground">{purchases.length}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rescue aperti</span>
                <span className={`text-foreground ${openRescues >= 3 ? 'font-medium text-destructive' : ''}`}>
                  {openRescues}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ultimo accesso</span>
                <span className="text-xs text-foreground">
                  {sessions[0]
                    ? new Date(sessions[0].createdAt).toLocaleDateString('it-IT')
                    : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Azioni */}
          <ImpresaActions
            companyId={company.id}
            currentStatus={company.status}
            currentVerified={company.verified}
            currentAdminNote={company.adminNote ?? ''}
          />
        </div>
      </div>
    </div>
  )
}