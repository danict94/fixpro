import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { Card, CardContent, CardHeader } from '@fixpro/ui'
import { SendAdminMessageForm } from './_components/send-admin-message-form'

function formatTime(d: Date | string) {
  return new Date(d).toLocaleString('it-IT', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  params: Promise<{ companyId: string }>
}

export default async function AssistenzaThreadPage({ params }: Props) {
  const { companyId } = await params

  let data: Awaited<ReturnType<typeof api.assistance.adminGetThread>>
  try {
    data = await api.assistance.adminGetThread({ companyId })
  } catch {
    notFound()
  }

  const { messages, company } = data

  return (
    <div className="space-y-6">

      <Link
        href="/assistenza"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 stroke-muted-foreground" strokeWidth={1.8} />
        Tutti i thread
      </Link>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground">{company.ragioneSociale}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{company.user.email}</p>
        </div>
        <Link
          href={`/imprese/${company.id}`}
          className="text-xs text-primary hover:underline"
        >
          Apri profilo impresa →
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <p className="text-sm font-medium text-foreground">
            Conversazione con {company.ragioneSociale}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4">

          {/* Messaggi */}
          <div className="min-h-[400px] space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground text-center">
                <p>Nessun messaggio ancora. Scrivi all&apos;impresa qui sotto.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isAdminSender = m.senderType === 'ADMIN'
                return (
                  <div key={m.id} className={`flex ${isAdminSender ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] space-y-1 flex flex-col ${isAdminSender ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                        isAdminSender
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}>
                        {m.body}
                      </div>
                      <span className="text-xs text-muted-foreground px-1">
                        {isAdminSender ? 'Tu (Admin)' : company.ragioneSociale} · {formatTime(m.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Form */}
          <SendAdminMessageForm companyId={company.id} />

        </CardContent>
      </Card>

    </div>
  )
}
