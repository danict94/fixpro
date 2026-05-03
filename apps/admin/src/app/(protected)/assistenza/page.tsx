import Link from 'next/link'
import { Headphones, MessageSquare } from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { Badge, Card, CardContent } from '@fixpro/ui'

export const metadata = { title: 'Assistenza' }

type AssistanceThreadLastMessage = {
  senderType: 'ADMIN' | 'COMPANY'
  body: string
  createdAt: Date | string
}

type AssistanceThread = {
  companyId: string
  ragioneSociale: string
  unreadCount: number
  lastMessage: AssistanceThreadLastMessage | null
}

function formatTime(d: Date | string) {
  return new Date(d).toLocaleString('it-IT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AssistenzaPage() {
  const threads = (await api.assistance.adminListThreads()) as AssistanceThread[]

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
          <CardContent className="flex flex-col items-center justify-center space-y-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Headphones className="h-6 w-6 stroke-muted-foreground" strokeWidth={1.9} />
            </div>

            <p className="font-semibold text-foreground">Nessun thread di assistenza</p>

            <p className="text-sm text-muted-foreground">
              Quando un&apos;impresa scrive, apparirà qui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {threads.map((t: AssistanceThread) => (
            <Link key={t.companyId} href={`/assistenza/${t.companyId}`}>
              <Card className="transition-shadow duration-150 hover:shadow-md">
                <CardContent className="flex items-center gap-4 px-5 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <MessageSquare className="h-4 w-4 stroke-muted-foreground" strokeWidth={1.9} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {t.ragioneSociale}
                      </p>

                      {t.unreadCount > 0 && (
                        <Badge variant="destructive" className="shrink-0 text-xs">
                          {t.unreadCount}
                        </Badge>
                      )}
                    </div>

                    {t.lastMessage && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {t.lastMessage.senderType === 'ADMIN' ? 'Tu: ' : ''}
                        {t.lastMessage.body}
                        {' · '}
                        {formatTime(t.lastMessage.createdAt)}
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