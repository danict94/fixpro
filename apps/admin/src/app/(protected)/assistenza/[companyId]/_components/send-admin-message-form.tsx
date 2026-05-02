'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { Button } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

export function SendAdminMessageForm({ companyId }: { companyId: string }) {
  const router            = useRouter()
  const [body, setBody]   = useState('')
  const [error, setError] = useState<string | null>(null)

  const send = trpc.assistance.adminSendMessage.useMutation({
    onSuccess: () => {
      setBody('')
      setError(null)
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    send.mutate({ companyId, body: body.trim() })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!body.trim() || send.isPending) return
      send.mutate({ companyId, body: body.trim() })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t pt-4 space-y-2">
      <div className="flex gap-2 items-end">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi all'impresa… (Invio per inviare)"
          rows={3}
          disabled={send.isPending}
          className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <Button
          type="submit"
          disabled={send.isPending || !body.trim()}
          size="icon"
          className="shrink-0 h-10 w-10"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  )
}
