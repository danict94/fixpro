'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap, AlertTriangle, Clock, CheckCircle, XCircle,
  MessageSquare, Star, Bell, ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

const ICON_MAP: Record<string, LucideIcon> = {
  NEW_REQUEST_IN_ZONE: Zap,
  CREDITS_LOW: AlertTriangle,
  CREDITS_EXPIRING: Clock,
  RESCUE_APPROVED: CheckCircle,
  RESCUE_REJECTED: XCircle,
  ADMIN_MESSAGE: MessageSquare,
  CLIENT_MESSAGE: MessageSquare,
  PROMO_REQUEST: Star,
  DEFAULT: Bell,
}

interface Props {
  id:         string
  title:      string
  body:       string
  isUnread:   boolean
  dateLabel:  string
  href?:      string
  iconType:   string
  iconColor:  string
  iconBg:     string
}

export function NotificationItem({ id, title, body, isUnread, dateLabel, href, iconType, iconColor, iconBg }: Props) {
  const [unread, setUnread] = useState(isUnread)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const mark = trpc.company.markNotificationRead.useMutation()
  const Icon = ICON_MAP[iconType] ?? Bell

  const handleActivate = () => {
    if (isPending) return

    if (unread) {
      setUnread(false)
      void mark.mutateAsync({ id }).catch(() => {
        setUnread(true)
      })
    }

    if (href) {
      startTransition(() => {
        router.push(href)
      })
    }
  }

  return (
    <Card
      className={`transition-colors duration-300 ${unread ? 'border-primary/30 bg-primary/5' : ''} ${
        href ? 'cursor-pointer hover:border-primary/25 hover:bg-muted/30' : 'cursor-pointer hover:bg-muted/20'
      }`}
    >
      <button
        type="button"
        onClick={handleActivate}
        className="block w-full text-left"
        aria-label={href ? `${title}. Apri notifica` : `${title}. Segna come letta`}
      >
        <CardContent className="flex items-start gap-4 py-4 px-5">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.9} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-semibold ${unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                {title}
              </p>
              {unread && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {dateLabel}
            </span>
            {href && <ChevronRight className="h-4 w-4 stroke-muted-foreground" strokeWidth={1.9} />}
          </div>
        </CardContent>
      </button>
    </Card>
  )
}
