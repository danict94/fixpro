import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/cn'

export interface TypeCardProps {
  icon: LucideIcon
  title: string
  subtitle: string
  onClick: () => void
  className?: string
  iconClassName?: string
  titleClassName?: string
  descriptionClassName?: string
}

export function TypeCard({
  icon: Icon,
  title,
  subtitle,
  onClick,
  className,
  iconClassName,
  titleClassName,
  descriptionClassName,
}: TypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-card p-7 text-center shadow-sm',
        'cursor-pointer transition-all duration-150',
        'hover:border-primary hover:shadow-md hover:bg-primary/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-colors duration-150 group-hover:bg-primary/20">
        <Icon
          className={cn('h-7 w-7 stroke-primary', iconClassName)}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <p className={cn('font-semibold text-foreground', titleClassName)}>{title}</p>
        <p className={cn('text-sm text-muted-foreground', descriptionClassName)}>{subtitle}</p>
      </div>
    </button>
  )
}
