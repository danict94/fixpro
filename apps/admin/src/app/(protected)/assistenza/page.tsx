import Link from 'next/link'
import { Headphones, MessageSquare } from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { Badge, Card, CardContent } from '@fixpro/ui'

export const metadata = { title: 'Assistenza' }

function formatTime(d: Date | string) {
  return new Date(d).toLocaleString('it-IT', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default async function AssistenzaPage() {
  const threads = await api.assistance.adminListThreads()

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-foreground">Assistenza</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Messaggi di supporto tecnico e amministrativo delle imprese.
        </p>
      </div>

      {threads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Headphones className="h-6 w-6 stroke-muted-foreground" strokeWidth={1.9} />
            </div>
            <p className="font-semibold text-foreground">Nessun thread di assistenza</p>
            <p className="text-sm text-muted-foreground">Quando un&apos;impresa scrive, apparirà qui.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <Link key={t.companyId} href={`/assistenza/${t.companyId}`}>
              <Card className="transition-shadow duration-150 hover:shadow-md">
                <CardContent className="flex items-center gap-4 py-3 px-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <MessageSquare className="h-4 w-4 stroke-muted-foreground" strokeWidth={1.9} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {t.ragioneSociale}
                      </p>
                      {t.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs shrink-0">
                          {t.unreadCount}
                        </Badge>
                      )}
                    </div>
                    {t.lastMessage && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {t.lastMessage.senderType === 'ADMIN' ? 'Tu: ' : ''}{t.lastMessage.body}
                        {' · '}{formatTime(t.lastMessage.createdAt)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}
