import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Phone, Mail, User, ShoppingBag, Zap, ArrowRight } from 'lucide-react'
import { auth } from '@/lib/auth'
import { api } from '@/lib/trpc/server'
import { Card, CardContent, Badge } from '@fixpro/ui'

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function AcquistiPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/accedi')

  const acquisti = await api.requests.listPurchased()

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-foreground">Richieste acquistate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tutte le richieste che hai sbloccato con i tuoi crediti.
        </p>
      </div>

      {acquisti.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <ShoppingBag className="mx-auto mb-3 h-8 w-8 stroke-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm font-medium text-muted-foreground">Nessuna richiesta acquistata.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vai a{' '}
            <Link href="/area-impresa/richieste" className="text-primary hover:underline">
              Richieste disponibili
            </Link>{' '}
            per iniziare.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {acquisti.map((a) => {
            const r = a.request
            return (
              <Card key={a.id} className="h-full">
                <CardContent className="p-6 space-y-4">

                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.categoria.settore.nome} → {r.categoria.nome}
                        {r.servizio && ` → ${r.servizio.nome}`}
                      </p>
                    </div>
                    {a.paymentMethod === 'CREDITS' && a.creditSpent > 0 && (
                      <span className="flex shrink-0 items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-semibold text-primary">
                        <Zap className="h-3 w-3" strokeWidth={2} />
                        {a.creditSpent} cr
                      </span>
                    )}
                  </div>

                  {/* Zona */}
                  {(r.city || r.province) && (
                    <p className="text-xs text-muted-foreground">
                      📍 {[r.city, r.province].filter(Boolean).join(', ')}
                    </p>
                  )}

                  {/* Contatti sbloccati */}
                  <div className="rounded-lg border border-success/30 bg-success/5 p-3 space-y-2">
                    <p className="text-xs font-medium text-success uppercase tracking-wide">Contatti sbloccati</p>
                    <div className="space-y-1.5">
                      {(r.contactName || r.contactSurname) && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3.5 w-3.5 shrink-0 stroke-muted-foreground" strokeWidth={1.9} />
                          <span className="font-medium text-foreground">
                            {[r.contactName, r.contactSurname].filter(Boolean).join(' ')}
                          </span>
                        </div>
                      )}
                      {r.contactPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 shrink-0 stroke-muted-foreground" strokeWidth={1.9} />
                          <a href={`tel:${r.contactPhone}`} className="font-medium text-primary hover:underline">
                            {r.contactPhone}
                          </a>
                        </div>
                      )}
                      {r.contactEmail && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3.5 w-3.5 shrink-0 stroke-muted-foreground" strokeWidth={1.9} />
                          <a href={`mailto:${r.contactEmail}`} className="font-medium text-primary hover:underline">
                            {r.contactEmail}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">
                      Acquistata il {formatDate(a.purchasedAt)}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {a.paymentMethod === 'CREDITS' ? 'Crediti' : 'One-time'}
                      </Badge>
                      <Link
                        href={`/area-impresa/richieste/${a.requestId}`}
                        className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                      >
                        Vedi dettagli
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                      </Link>
                    </div>
                  </div>

                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
