import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from './card'
import { cn } from '../lib/cn'

export interface StepCardProps {
  step: number
  title: string
  description: string
  icon: LucideIcon
  className?: string
  iconClassName?: string
  titleClassName?: string
  descriptionClassName?: string
}

export function StepCard({
  step,
  title,
  description,
  icon: Icon,
  className,
  iconClassName,
  titleClassName,
  descriptionClassName,
}: StepCardProps) {
  return (
    <Card className={cn('h-full', className)}>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {step}
          </span>
          <Icon
            className={cn('h-6 w-6 stroke-primary', iconClassName)}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={cn('font-semibold text-foreground', titleClassName)}>{title}</span>
          <span className={cn('text-sm text-muted-foreground leading-relaxed', descriptionClassName)}>
            {description}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
