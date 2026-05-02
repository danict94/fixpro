'use client'

import { useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'

export function MarkAllRead({ hasUnread }: { hasUnread: boolean }) {
  const markAll = trpc.company.markAllNotificationsRead.useMutation()

  useEffect(() => {
    if (hasUnread) {
      markAll.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
