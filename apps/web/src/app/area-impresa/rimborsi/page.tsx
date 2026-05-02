import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { RotateCcw, Clock, CheckCircle, XCircle, AlertTriangle, Zap } from 'lucide-react'
import { formatRequestDisplayTitle, formatRequestPublishedLabel } from '@fixpro/shared'
import { auth } from '@/lib/auth'
import { api } from '@/lib/trpc/server'
import { Card, CardContent, Badge } from '@fixpro/ui'
import { OpenRescueForm } from './_components/open-rescue-form'

const STATUS_CONFIG = {
  OPEN:         { label: 'Aperto',       variant: 'warning',     dot: 'bg-warning' },
  UNDER_REVIEW: { label: 'In revisione', variant: 'secondary',   dot: 'bg-muted-foreground' },
  APPROVED:     { label: 'Approvato',    variant: 'success',     dot: 'bg-success' },
  REJECTED:     { label: 'Rifiutato',    variant: 'destructive', dot: 'bg-destructive' },
  CLOSED:       { label: 'Chiuso',       variant: 'secondary',   dot: 'bg-muted-foreground' },
} as const

function StatusIcon({ status }: { status: string }) {
  if (status === 'APPROVED')     return <CheckCircle  className="h-4 w-4 shrink-0 stroke-success"      strokeWidth={2} />
  if (status === 'REJECTED')     return <XCircle      className="h-4 w-4 shrink-0 stroke-destructive"  strokeWidth={2} />
  if (status === 'UNDER_REVIEW') return <AlertTriangle className="h-4 w-4 shrink-0 stroke-warning"     strokeWidth={2} />
  return <Clock className="h-4 w-4 shrink-0 stroke-muted-foreground" strokeWidth={1.9} />
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
}

interface Props {
  searchParams: Promise<{ requestId?: string }>
}

export default async function RimborsiPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/accedi')

  const { requestId } = await searchParams

  const [rescues, eligiblePurchases] = await Promise.all([
    api.rescues.list(),
    api.rescues.eligiblePurchases(),
  ])

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rimborsi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rescues.length > 0
              ? `${rescues.length} ${rescues.length === 1 ? 'richiesta' : 'richieste'} di rimborso`
              : 'Richieste di rimborso crediti per acquisti non idonei.'}
          </p>
        </div>
        <OpenRescueForm purchases={eligiblePurchases} defaultRequestId={requestId} />
      </div>

      {/* Informativa */}
      <Card className="border-border bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Quando puoi richiedere un rimborso?</p>
          <ul className="list-disc pl-4 space-y-0.5 text-xs">
            <li>Il cliente non risponde a telefono né via email dopo più tentativi</li>
            <li>I dati di contatto forniti sono errati o inesistenti</li>
            <li>Il lavoro era già stato assegnato a un&apos;altra impresa</li>
            <li>La richiesta non corrisponde a quanto pubblicato</li>
          </ul>
          <p className="text-xs">Il team FixPro verifica ogni richiesta entro 2 giorni lavorativi.</p>
        </CardContent>
      </Card>

      {rescues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <RotateCcw className="h-6 w-6 stroke-muted-foreground" strokeWidth={1.9} />
            </div>
            <p className="font-semibold text-foreground">Nessun rimborso richiesto</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Se hai acquistato una richiesta di scarsa qualità puoi aprire un rimborso con il pulsante in alto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {rescues.map((r) => {
            const cfg = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.OPEN
            const displayTitle = formatRequestDisplayTitle({
              title: r.request.title,
              interventoNome: r.request.intervento?.nome,
              city: r.request.city,
              province: r.request.province,
            })
            const publishedAt = r.request.approvedAt ?? r.request.createdAt
            // Cerca il creditSpent dall'audit o dalla request (non disponibile direttamente nel list)
            return (
              <Card key={r.id}>
                <CardContent className="p-6 space-y-4">

                  {/* Header card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={r.status} />
                        <p className="truncate font-semibold text-foreground">{displayTitle}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.request.categoria.nome}
                        {' · '}
                        {formatRequestPublishedLabel(publishedAt)}
                      </p>
                    </div>
                    <Badge
                      variant={cfg.variant as 'outline' | 'secondary' | 'destructive' | 'success' | 'warning'}
                      className="shrink-0 text-xs"
                    >
                      {cfg.label}
                    </Badge>
                  </div>

                  {/* Motivazione */}
                  <div className="rounded-md bg-muted/40 px-3 py-2.5 text-sm">
                    <p className="font-medium text-foreground mb-1 text-xs uppercase tracking-wide">Motivo</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{r.reason}</p>
                  </div>

                  {/* Risposta admin */}
                  {r.adminNote && (
                    <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm">
                      <p className="font-medium text-foreground mb-1 text-xs uppercase tracking-wide">Risposta FixPro</p>
                      <p className="text-foreground">{r.adminNote}</p>
                    </div>
                  )}

                  {/* Rimborso avvenuto */}
                  {r.status === 'APPROVED' && (
                    <div className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
                      <Zap className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span>Crediti rimborsati sul tuo saldo.</span>
                    </div>
                  )}

                  {/* Date e audit */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Aperto il {formatDate(r.createdAt)}</span>
                    {r.resolvedAt && <span>Risolto il {formatDate(r.resolvedAt)}</span>}
                  </div>

                  {r.audit.length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
                        Storico ({r.audit.length} {r.audit.length === 1 ? 'evento' : 'eventi'})
                      </summary>
                      <div className="mt-3 relative pl-4 space-y-0">
                        <div className="absolute left-1.5 top-1 bottom-1 w-px bg-border" />
                        {r.audit.map((a) => (
                          <div key={a.id} className="relative pb-3">
                            <div className="absolute -left-1 top-1 h-2 w-2 rounded-full border border-border bg-background" />
                            <div className="pl-2">
                              <span className="font-medium text-foreground">{a.action}</span>
                              {a.note && <span className="text-muted-foreground"> — {a.note}</span>}
                              <p className="text-muted-foreground mt-0.5">
                                {new Date(a.createdAt).toLocaleDateString('it-IT', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
