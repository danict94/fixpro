import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { Prisma } from '@fixpro/db'
import { Bell } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@fixpro/db'
import { Badge, Card, CardContent } from '@fixpro/ui'
import { NotificationItem } from './_components/notification-item'

export const metadata = { title: 'Notifiche' }

const TYPE_CONFIG: Record<string, { iconType: string; color: string; bg: string }> = {
  NEW_REQUEST_IN_ZONE: { iconType: 'NEW_REQUEST_IN_ZONE', color: 'stroke-primary',     bg: 'bg-primary/10' },
  CREDITS_LOW:         { iconType: 'CREDITS_LOW',         color: 'stroke-warning',     bg: 'bg-warning/10' },
  CREDITS_EXPIRING:    { iconType: 'CREDITS_EXPIRING',    color: 'stroke-warning',     bg: 'bg-warning/10' },
  RESCUE_APPROVED:     { iconType: 'RESCUE_APPROVED',     color: 'stroke-success',     bg: 'bg-success/10' },
  RESCUE_REJECTED:     { iconType: 'RESCUE_REJECTED',     color: 'stroke-destructive', bg: 'bg-destructive/10' },
  ADMIN_MESSAGE:       { iconType: 'ADMIN_MESSAGE',       color: 'stroke-foreground',  bg: 'bg-muted' },
  CLIENT_MESSAGE:      { iconType: 'CLIENT_MESSAGE',      color: 'stroke-foreground',  bg: 'bg-muted' },
  PROMO_REQUEST:       { iconType: 'PROMO_REQUEST',       color: 'stroke-warning',     bg: 'bg-warning/10' },
}

function getNotificationData(data: Prisma.JsonValue | null): Record<string, unknown> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  return data as Record<string, unknown>
}

function getStringField(data: Record<string, unknown>, key: string) {
  const value = data[key]
  return typeof value === 'string' ? value : undefined
}

function resolveNotificationHref(type: string, data: Prisma.JsonValue | null) {
  const payload = getNotificationData(data)
  const requestId = getStringField(payload, 'requestId')
  const purchaseId = getStringField(payload, 'purchaseId')
  const section = getStringField(payload, 'section')

  if (type === 'NEW_REQUEST_IN_ZONE') {
    return requestId ? `/area-impresa/richieste/${requestId}` : '/area-impresa/richieste'
  }

  if (type === 'CLIENT_MESSAGE') {
    return purchaseId ? `/area-impresa/contatti/${purchaseId}` : '/area-impresa/contatti'
  }

  if (type === 'CREDITS_LOW' || type === 'CREDITS_EXPIRING') {
    return '/area-impresa/crediti'
  }

  if (type === 'RESCUE_APPROVED' || type === 'RESCUE_REJECTED') {
    return requestId ? `/area-impresa/rimborsi?requestId=${requestId}` : '/area-impresa/rimborsi'
  }

  if (type === 'ADMIN_MESSAGE') {
    if (section === 'assistenza') return '/area-impresa/assistenza'
    if (section === 'rimborsi') {
      return requestId ? `/area-impresa/rimborsi?requestId=${requestId}` : '/area-impresa/rimborsi'
    }
    if (requestId) return `/area-impresa/richieste/${requestId}`
    return '/area-impresa/assistenza'
  }

  if (type === 'PROMO_REQUEST') {
    return '/area-impresa/richieste?mode=explore'
  }

  return undefined
}

export default async function NotifichePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/accedi')

  const notifications = await prisma.notification.findMany({
    where: {
      userId:  session.user.id,
      channel: 'IN_APP',
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unreadCount = notifications.filter((n) => !n.readAt).length
  const hasUnread   = unreadCount > 0

  const now = new Date()

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifiche</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Avvisi su nuove richieste, crediti e aggiornamenti del tuo account.
          </p>
        </div>
        {hasUnread && (
          <Badge variant="warning">
            {unreadCount} non {unreadCount === 1 ? 'letta' : 'lette'}
          </Badge>
        )}
      </div>

      {/* Lista */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Bell className="h-6 w-6 stroke-muted-foreground" strokeWidth={1.9} />
            </div>
            <p className="font-semibold text-foreground">Nessuna notifica</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Le notifiche sulle nuove richieste nella tua zona appariranno qui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? {
              iconType: 'DEFAULT',
              color: 'stroke-muted-foreground',
              bg:    'bg-muted',
            }
            const date     = new Date(n.createdAt)
            const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
            const dateLabel = diffDays === 0
              ? 'Oggi ' + date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
              : diffDays === 1
                ? 'Ieri'
                : date.toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'short',
                    ...(now.getFullYear() !== date.getFullYear() ? { year: 'numeric' } : {}),
                  })

            return (
              <NotificationItem
                key={n.id}
                id={n.id}
                title={n.title}
                body={n.body ?? ''}
                isUnread={!n.readAt}
                dateLabel={dateLabel}
                href={resolveNotificationHref(n.type, n.data)}
                iconType={cfg.iconType}
                iconColor={cfg.color}
                iconBg={cfg.bg}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
