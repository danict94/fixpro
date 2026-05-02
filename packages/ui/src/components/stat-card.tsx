import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from './card'
import { cn } from '../lib/cn'
import { iconToneClass, iconBgClass, type Tone } from '../lib/tone'

export interface StatCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  tone?: Tone
  className?: string
}

export function StatCard({ label, value, icon: Icon, tone = 'brand', className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center gap-4 py-5">
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconBgClass(tone))}>
            <Icon
              className={cn('h-5 w-5', iconToneClass(tone))}
              aria-hidden="true"
            />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
