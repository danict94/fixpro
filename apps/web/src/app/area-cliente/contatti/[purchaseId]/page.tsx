import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/lib/auth'
import { api } from '@/lib/trpc/server'
import { Card, CardContent, CardHeader, CardTitle } from '@fixpro/ui'
import { SendClientMessageForm } from './_components/send-client-message-form'

function formatTime(d: Date | string) {
  return new Date(d).toLocaleString('it-IT', {
    day:    '2-digit',
    month:  'short',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

export default async function ClienteContattiThreadPage({
  params,
}: {
  params: Promise<{ purchaseId: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/accedi')

  const { purchaseId } = await params

  let thread: Awaited<ReturnType<typeof api.contacts.getClientThread>>
  try {
    thread = await api.contacts.getClientThread({ purchaseId })
  } catch {
    notFound()
  }

  const { company, request, messages } = thread
  const companyName = company.ragioneSociale

  return (
    <div className="space-y-4">

      <Link
        href="/area-cliente/contatti"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
        Tutti i contatti
      </Link>

      <Card className="flex flex-col">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base">{request.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {request.categoria.nome} · {companyName}
          </p>
        </CardHeader>

        <CardContent className="flex flex-col gap-2 p-4 min-h-[400px]">

          <div className="flex-1 space-y-3 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                Nessun messaggio ancora.
              </div>
            ) : (
              messages.map((m) => {
                const isClient = m.senderType === 'CLIENT'
                return (
                  <div key={m.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] space-y-1 ${isClient ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                        isClient
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}>
                        {m.body}
                      </div>
                      <span className="text-xs text-muted-foreground px-1">
                        {isClient ? 'Tu' : companyName} · {formatTime(m.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <SendClientMessageForm purchaseId={purchaseId} />

        </CardContent>
      </Card>
    </div>
  )
}
