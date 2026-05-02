'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { Button, Card, CardContent } from '@fixpro/ui'

interface ReviewFormProps {
  purchaseId: string
  companyName: string
  onDone: () => void
}

export function ReviewForm({ purchaseId, companyName, onDone }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createReview = trpc.reviews.createByClient.useMutation({
    onSuccess: onDone,
    onError: (e) => setError(e.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (rating === 0) {
      setError('Seleziona un voto.')
      return
    }
    createReview.mutate({ purchaseId, rating, body: body || undefined })
  }

  const displayed = hovered || rating

  return (
    <Card className="surface-card border-0 shadow-none">
      <CardContent className="space-y-4 px-5 py-5 sm:px-6">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-secondary">
            Recensisci <span className="text-primary">{companyName}</span>
          </p>
          <p className="muted-copy text-xs">
            Condividi com&apos;e andata. La recensione sara pubblicata dopo la verifica del nostro
            team.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setRating(v)}
              onMouseEnter={() => setHovered(v)}
              className="rounded-full p-1 transition-transform hover:scale-105"
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  v <= displayed
                    ? 'fill-warning stroke-none'
                    : 'fill-none stroke-muted-foreground'
                }`}
                strokeWidth={1.5}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="muted-copy ml-2 text-xs">
              {rating === 1
                ? 'Scarso'
                : rating === 2
                  ? 'Sufficiente'
                  : rating === 3
                    ? 'Buono'
                    : rating === 4
                      ? 'Ottimo'
                      : 'Eccellente'}
            </span>
          )}
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Commento opzionale (max 1000 caratteri)"
          maxLength={1000}
          rows={3}
          className="w-full rounded-[18px] border border-border bg-white px-4 py-3 text-sm text-secondary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />

        {error && (
          <p className="rounded-[18px] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={createReview.isPending || rating === 0}
            className="primary-pill px-4 py-2 text-sm font-semibold"
          >
            {createReview.isPending ? 'Invio...' : 'Invia recensione'}
          </Button>
          <button
            type="button"
            onClick={onDone}
            className="secondary-link text-sm"
          >
            Annulla
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
