import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { ArrowLeft, Phone, Mail, User } from 'lucide-react'
import { formatRequestDisplayTitle } from '@fixpro/shared'
import { auth } from '@/lib/auth'
import { api } from '@/lib/trpc/server'
import { Card, CardContent, CardHeader, CardTitle } from '@fixpro/ui'
import { SendMessageForm } from './_components/send-message-form'

function formatTime(d: Date | string) {
  return new Date(d).toLocaleString('it-IT', {
    day:    '2-digit',
    month:  'short',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

export default async function ContattiThreadPage({
  params,
}: {
  params: Promise<{ purchaseId: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/accedi')

  const { purchaseId } = await params

  let thread: Awaited<ReturnType<typeof api.contacts.getThread>>
  try {
    thread = await api.contacts.getThread({ purchaseId })
  } catch {
    notFound()
  }

  const { request, messages } = thread
  const clientName = [request.contactName, request.contactSurname].filter(Boolean).join(' ') || 'Cliente'
  const displayTitle = formatRequestDisplayTitle({
    title: request.title,
    interventoNome: request.intervento?.nome,
    city: request.city,
    province: request.province,
  })

  return (
    <div className="space-y-4">

      {/* Back */}
      <Link
        href="/area-impresa/contatti"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
        Tutti i contatti
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">

        {/* Chat */}
        <div className="lg:col-span-3">
          <Card className="flex flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">{displayTitle}</CardTitle>
              <p className="text-sm text-muted-foreground">{request.categoria.nome} · {[request.city, request.province].filter(Boolean).join(', ')}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 min-h-[400px]">

              {/* Messaggi */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                    Nessun messaggio ancora. Invia il primo!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isCompany = m.senderType === 'COMPANY'
                    return (
                      <div key={m.id} className={`flex ${isCompany ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] space-y-1 ${isCompany ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                            isCompany
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm'
                          }`}>
                            {m.body}
                          </div>
                          <span className="text-xs text-muted-foreground px-1">
                            {isCompany ? 'Tu' : clientName} · {formatTime(m.createdAt)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Form invio */}
              <SendMessageForm purchaseId={purchaseId} />

            </CardContent>
          </Card>
        </div>

        {/* Sidebar contatti */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Dati cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 shrink-0 stroke-muted-foreground" strokeWidth={1.9} />
                <span className="font-medium text-foreground">{clientName}</span>
              </div>
              {request.contactPhone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 stroke-muted-foreground" strokeWidth={1.9} />
                  <a href={`tel:${request.contactPhone}`} className="text-primary hover:underline">
                    {request.contactPhone}
                  </a>
                </div>
              )}
              {request.contactEmail && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 stroke-muted-foreground" strokeWidth={1.9} />
                  <a href={`mailto:${request.contactEmail}`} className="text-primary hover:underline break-all">
                    {request.contactEmail}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
