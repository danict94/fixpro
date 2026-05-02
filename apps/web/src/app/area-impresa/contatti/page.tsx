import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { MessageSquare, ChevronRight } from 'lucide-react'
import { formatRequestDisplayTitle } from '@fixpro/shared'
import { auth } from '@/lib/auth'
import { api } from '@/lib/trpc/server'
import { Card, CardContent, Badge } from '@fixpro/ui'

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function ContattiPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/accedi')

  const threads = await api.contacts.listThreads()

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-foreground">Contatti</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversazioni con i clienti per le richieste che hai acquistato.
        </p>
      </div>

      {threads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-6 w-6 stroke-muted-foreground" strokeWidth={1.9} />
            </div>
            <p className="font-semibold text-foreground">Nessun contatto attivo</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Acquista una richiesta per avviare una conversazione con il cliente.
            </p>
            <Link
              href="/area-impresa/richieste"
              className="mt-1 text-sm font-medium text-primary hover:underline"
            >
              Vai alle richieste →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {threads.map((t) => {
            const displayTitle = formatRequestDisplayTitle({
              title: t.title,
              interventoNome: t.interventoNome,
              city: t.city,
              province: t.province,
            })

            return (
              <Link
                key={t.purchaseId}
                href={`/area-impresa/contatti/${t.purchaseId}`}
                className="flex items-center gap-4 px-4 py-4 hover:bg-muted/40 transition-colors"
              >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-5 w-5 stroke-primary" strokeWidth={1.9} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium text-foreground">{displayTitle}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {t.lastMessage ? formatDate(t.lastMessage.createdAt) : formatDate(t.purchasedAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.categoriaNome} · {[t.city, t.province].filter(Boolean).join(', ') || 'Zona non specificata'}
                </p>
                {t.lastMessage ? (
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {t.lastMessage.senderType === 'COMPANY' ? 'Tu: ' : `${[t.contactName, t.contactSurname].filter(Boolean).join(' ') || 'Cliente'}: `}
                    {t.lastMessage.body}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground italic">Nessun messaggio ancora</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {t.unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1.5 text-xs">
                    {t.unreadCount}
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 stroke-muted-foreground" strokeWidth={1.9} />
              </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
