'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

interface TabNotificheProps {
  notificationEmail: boolean
  notificationWhatsapp: boolean
}

export function TabNotifiche({ notificationEmail: initialEmail, notificationWhatsapp: initialWhatsapp }: TabNotificheProps) {
  const router = useRouter()
  const [notificationEmail, setNotificationEmail] = useState(initialEmail)
  const [notificationWhatsapp, setNotificationWhatsapp] = useState(initialWhatsapp)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const update = trpc.company.updateProfile.useMutation({
    onSuccess: () => {
      setSuccess(true)
      setError(null)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate({ notificationEmail, notificationWhatsapp })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="surface-section px-5 py-5 sm:px-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
            <Bell className="h-4 w-4 stroke-warning" strokeWidth={1.9} />
          </div>
          <div>
            <p className="font-semibold text-secondary">Preferenze notifiche</p>
            <p className="text-xs text-muted-foreground">
              Scegli come vuoi essere avvisato delle nuove richieste nella tua zona. Configurare almeno un canale è fortemente consigliato.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-between rounded-[22px] border border-border bg-[#F6F7FB] px-4 py-3 transition-colors hover:bg-muted/80">
            <div>
              <p className="text-sm font-medium text-secondary">Email</p>
              <p className="text-xs text-muted-foreground">Ricevi un&apos;email per ogni nuova richiesta nella tua zona (consigliato)</p>
            </div>
            <input
              type="checkbox"
              checked={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.checked)}
              className="h-4 w-4 shrink-0 accent-primary"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-[22px] border border-border bg-[#F6F7FB] px-4 py-3 transition-colors hover:bg-muted/80">
            <div>
              <p className="text-sm font-medium text-secondary">WhatsApp</p>
              <p className="text-xs text-muted-foreground">Ricevi un messaggio WhatsApp per ogni nuova richiesta (richiede numero verificato)</p>
            </div>
            <input
              type="checkbox"
              checked={notificationWhatsapp}
              onChange={(e) => setNotificationWhatsapp(e.target.checked)}
              className="h-4 w-4 shrink-0 accent-primary"
            />
          </label>
        </div>

        {!notificationEmail && !notificationWhatsapp && (
          <div className="mt-4 rounded-[18px] border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
            Nessun canale attivo - potresti perdere nuove richieste nella tua zona.
          </div>
        )}
      </section>

      {error && <p className="rounded-[18px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {success && <p className="rounded-[18px] border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">Preferenze salvate con successo.</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending} className="primary-pill min-w-36">
          {update.isPending ? 'Salvataggio...' : 'Salva preferenze'}
        </Button>
      </div>
    </form>
  )
}
