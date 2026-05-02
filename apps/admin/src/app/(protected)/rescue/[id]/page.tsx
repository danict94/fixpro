import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Phone, Mail, User, AlertTriangle, Zap, CreditCard, BadgeCheck } from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@fixpro/ui'
import { RescueActions } from './_components/rescue-actions'

const RESCUE_STATUS_CONFIG = {
  OPEN:         { label: 'Aperto',       variant: 'warning' },
  UNDER_REVIEW: { label: 'In revisione', variant: 'secondary' },
  APPROVED:     { label: 'Approvato',    variant: 'success' },
  REJECTED:     { label: 'Rifiutato',    variant: 'destructive' },
  CLOSED:       { label: 'Chiuso',       variant: 'secondary' },
} as const

const URGENCY_LABEL: Record<string, string> = {
  WITHIN_1_MONTH:  'Entro 1 mese',
  WITHIN_3_MONTHS: 'Entro 3 mesi',
  WITHIN_6_MONTHS: 'Entro 6 mesi',
  NO_PREFERENCE:   'Nessuna preferenza',
}

const INTENTION_LABEL: Record<string, string> = {
  YES:        'Pronto a procedere',
  MAYBE:      'Forse',
  INFO_ONLY:  'Solo informazioni',
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function RescueDetailPage({ params }: Props) {
  const { id } = await params

  let rescue: Awaited<ReturnType<typeof api.admin.rescue.get>>
  try {
    rescue = await api.admin.rescue.get({ id })
  } catch {
    notFound()
  }

  const cfg = RESCUE_STATUS_CONFIG[rescue.status]
  const { purchase, rescuesThisMonth } = rescue
  const req = rescue.request

  return (
    <div className="space-y-6">

      <Link
        href="/rescue"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
      >
        <ArrowLeft className="h-4 w-4 stroke-muted-foreground" strokeWidth={1.8} />
        Tutti i rescue
      </Link>

      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground">
            Rescue — {rescue.company.ragioneSociale}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{req.title}</p>
        </div>
        <Badge variant={cfg.variant as 'secondary' | 'success' | 'warning' | 'destructive'}>
          {cfg.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Colonna principale ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Motivazione impresa */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Motivazione dell&apos;impresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{rescue.reason}</p>
              {rescue.adminNote && (
                <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Nota admin</p>
                  <p className="text-sm text-foreground">{rescue.adminNote}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contatti cliente — sempre visibili all'admin */}
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-4 w-4 stroke-warning" strokeWidth={2} />
                Contatti cliente
                <Badge variant="outline" className="ml-auto text-xs font-normal">Riservati — solo admin</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {(req.contactName || req.contactSurname) && (
                <div className="flex items-center gap-2.5 text-sm">
                  <User className="h-4 w-4 shrink-0 stroke-muted-foreground" strokeWidth={1.9} />
                  <span className="font-medium text-foreground">
                    {[req.contactName, req.contactSurname].filter(Boolean).join(' ')}
                  </span>
                </div>
              )}
              {req.contactPhone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="h-4 w-4 shrink-0 stroke-muted-foreground" strokeWidth={1.9} />
                  <a href={`tel:${req.contactPhone}`} className="font-medium text-primary hover:underline">
                    {req.contactPhone}
                  </a>
                </div>
              )}
              {req.contactEmail && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="h-4 w-4 shrink-0 stroke-muted-foreground" strokeWidth={1.9} />
                  <a href={`mailto:${req.contactEmail}`} className="font-medium text-primary hover:underline">
                    {req.contactEmail}
                  </a>
                </div>
              )}
              {/* Fallback dati account cliente */}
              {!req.contactPhone && !req.contactEmail && (
                <div className="space-y-1 text-sm">
                  <p className="text-foreground">{rescue.request.client.name}</p>
                  <a href={`mailto:${rescue.request.client.email}`} className="text-primary hover:underline">
                    {rescue.request.client.email}
                  </a>
                  {rescue.request.client.phoneNumber && (
                    <a href={`tel:${rescue.request.client.phoneNumber}`} className="block text-primary hover:underline">
                      {rescue.request.client.phoneNumber}
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dettagli richiesta originale */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Richiesta originale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {req.categoria.settore.nome} → {req.categoria.nome}
                {req.servizio && ` → ${req.servizio.nome}`}
              </p>

              {(req.city || req.province || req.address) && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                  <span>{[req.address, req.city, req.province].filter(Boolean).join(', ')}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {req.urgency && (
                  <Badge variant="outline" className="text-xs">
                    {URGENCY_LABEL[req.urgency] ?? req.urgency}
                  </Badge>
                )}
                {req.propertyType && (
                  <Badge variant="outline" className="text-xs">
                    {req.propertyType === 'RESIDENTIAL' ? 'Residenziale' : 'Commerciale'}
                  </Badge>
                )}
                {req.hasImages && (
                  <Badge variant="outline" className="text-xs">Con foto</Badge>
                )}
                {req.intention && (
                  <Badge variant="outline" className="text-xs">
                    {INTENTION_LABEL[req.intention] ?? req.intention}
                  </Badge>
                )}
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrizione</p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{req.description}</p>
              </div>

              <div className="pt-1">
                <Link
                  href={`/richieste/${req.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  Apri richiesta originale →
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Audit trail */}
          {rescue.audit.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Storico azioni</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-0 pl-4">
                  <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
                  {rescue.audit.map((a) => (
                    <div key={a.id} className="relative flex items-start gap-3 pb-4 text-sm">
                      <div className="absolute -left-1 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-border bg-background" />
                      <div className="min-w-0 pl-2">
                        <span className="font-semibold text-foreground">{a.action}</span>
                        {a.note && <span className="text-muted-foreground"> — {a.note}</span>}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(a.createdAt).toLocaleDateString('it-IT', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* ── Colonna destra (sidebar) ── */}
        <div className="space-y-4">

          {/* Impresa */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="font-semibold text-foreground">Impresa</p>
              <div className="space-y-1.5 text-sm">
                <Link
                  href={`/imprese/${rescue.company.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {rescue.company.ragioneSociale}
                </Link>
                <p className="text-muted-foreground">{rescue.company.user.email}</p>
                <p className="text-muted-foreground">
                  Crediti attuali: <span className="font-medium text-foreground">{rescue.company.creditBalance?.total ?? 0}</span>
                </p>
              </div>
              {/* Anti-abuso */}
              {rescuesThisMonth > 0 && (
                <div className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${
                  rescuesThisMonth >= 3
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-warning/10 text-warning'
                }`}>
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  {rescuesThisMonth} rescue negli ultimi 30 gg
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acquisto */}
          {purchase && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="font-semibold text-foreground">Acquisto originale</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Metodo</span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      {purchase.paymentMethod === 'CREDITS'
                        ? <><Zap className="h-3.5 w-3.5 stroke-warning" strokeWidth={2} />{purchase.creditSpent} crediti</>
                        : <><CreditCard className="h-3.5 w-3.5 stroke-info" strokeWidth={2} />€{((purchase.amountCents ?? 0) / 100).toFixed(2)}</>
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Acquistato il</span>
                    <span className="text-foreground">{formatDate(purchase.purchasedAt)}</span>
                  </div>
                </div>

                {/* Preview rimborso */}
                {rescue.status !== 'APPROVED' && rescue.status !== 'REJECTED' && rescue.status !== 'CLOSED' && (
                  <div className={`rounded-md px-3 py-2.5 text-xs ${
                    purchase.paymentMethod === 'CREDITS'
                      ? 'bg-success/10 text-success'
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {purchase.paymentMethod === 'CREDITS' && purchase.creditSpent > 0 && (
                      <p className="flex items-center gap-1.5">
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        Approvando verranno rimborsati <strong>{purchase.creditSpent} crediti</strong> (scad. +1 anno)
                      </p>
                    )}
                    {purchase.paymentMethod === 'ONE_TIME' && (
                      <p>Pagamento one-time: il rimborso Stripe va gestito manualmente dal pannello Stripe.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info rescue */}
          <Card>
            <CardContent className="p-5 space-y-2 text-sm">
              <p className="font-semibold text-foreground">Info rescue</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aperto il</span>
                <span className="text-foreground">{formatDate(rescue.createdAt)}</span>
              </div>
              {rescue.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risolto il</span>
                  <span className="text-foreground">{formatDate(rescue.resolvedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Azioni */}
          <RescueActions
            rescueId={rescue.id}
            currentStatus={rescue.status}
            creditSpent={purchase?.creditSpent ?? 0}
            paymentMethod={purchase?.paymentMethod ?? 'CREDITS'}
          />

        </div>
      </div>
    </div>
  )
}
