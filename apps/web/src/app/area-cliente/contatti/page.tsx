import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { MessageSquare, ChevronRight } from 'lucide-react'
import { auth } from '@/lib/auth'
import { api } from '@/lib/trpc/server'
import { Card, CardContent, Badge } from '@fixpro/ui'

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function ClienteContattiPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/accedi')

  const threads = await api.contacts.listClientThreads()

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-foreground">Contatti</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversazioni con le imprese che hanno acquistato le tue richieste.
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
              Quando un&apos;impresa acquista la tua richiesta potrai chattare direttamente qui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {threads.map((t) => (
            <Link
              key={t.purchaseId}
              href={`/area-cliente/contatti/${t.purchaseId}`}
              className="flex items-center gap-4 px-4 py-4 hover:bg-muted/40 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-5 w-5 stroke-primary" strokeWidth={1.9} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium text-foreground">{t.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {t.lastMessage ? formatDate(t.lastMessage.createdAt) : formatDate(t.purchasedAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.companyName} · {t.categoriaNome}
                </p>
                {t.lastMessage ? (
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {t.lastMessage.senderType === 'CLIENT' ? 'Tu: ' : `${t.companyName}: `}
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
          ))}
        </div>
      )}
    </div>
  )
}
