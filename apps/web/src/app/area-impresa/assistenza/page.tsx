import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Headphones } from 'lucide-react'
import { auth } from '@/lib/auth'
import { api } from '@/lib/trpc/server'
import { Card, CardContent, CardHeader, CardTitle } from '@fixpro/ui'
import { SendAssistanceForm } from './_components/send-assistance-form'

function formatTime(d: Date | string) {
  return new Date(d).toLocaleString('it-IT', {
    day:    '2-digit',
    month:  'short',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

export default async function AssistenzaPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/accedi')

  const messages = await api.assistance.getThread()

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-foreground">Assistenza</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Supporto tecnico e amministrativo con il team FixPro.
        </p>
      </div>

      <Card className="flex flex-col">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Headphones className="h-4.5 w-4.5 stroke-primary" strokeWidth={1.9} />
            </div>
            <div>
              <CardTitle className="text-base">Team FixPro</CardTitle>
              <p className="text-xs text-muted-foreground">Risposta entro 24 ore lavorative</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 p-4">

          {/* Messaggi */}
          <div className="min-h-[350px] space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground text-center">
                <div className="space-y-1">
                  <p>Nessun messaggio ancora.</p>
                  <p>Scrivi al team FixPro per qualsiasi domanda tecnica o amministrativa.</p>
                </div>
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
                        {isCompany ? 'Tu' : 'FixPro'} · {formatTime(m.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Form */}
          <SendAssistanceForm />

        </CardContent>
      </Card>

    </div>
  )
}
