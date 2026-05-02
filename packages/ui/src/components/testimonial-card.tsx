import { Star } from 'lucide-react'
import { Card, CardContent } from './card'
import { cn } from '../lib/cn'

export interface TestimonialCardProps {
  quote: string
  author: string
  city: string
  category: string
  rating?: number
  className?: string
}

export function TestimonialCard({
  quote,
  author,
  city,
  category,
  rating = 5,
  className,
}: TestimonialCardProps) {
  const stars = Math.min(5, Math.max(1, Math.round(rating)))

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardContent className="flex flex-col gap-5 p-6 h-full">
        {/* Stelle */}
        <div className="flex gap-0.5" aria-label={`Valutazione: ${stars} su 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-4 w-4 shrink-0 stroke-none',
                i < stars ? 'fill-warning' : 'fill-border',
              )}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Testo testimonianza */}
        <p className="flex-1 text-sm leading-relaxed text-foreground">
          &ldquo;{quote}&rdquo;
        </p>

        {/* Autore */}
        <div className="flex flex-col gap-0.5 border-t border-border pt-4">
          <span className="text-sm font-semibold text-foreground">
            {author}
          </span>
          <span className="text-xs text-muted-foreground">
            {city} &middot; {category}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
