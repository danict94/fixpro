import type { LucideIcon } from 'lucide-react'
import { Badge } from './badge'
import { Card, CardContent } from './card'
import { cn } from '../lib/cn'

export interface SectorCardProps {
  nome: string
  categorieCount: number
  fase: string
  icon: LucideIcon
  className?: string
  iconClassName?: string
  titleClassName?: string
  metaClassName?: string
  badgeClassName?: string
}

export function SectorCard({
  nome,
  categorieCount,
  fase,
  icon: Icon,
  className,
  iconClassName,
  titleClassName,
  metaClassName,
  badgeClassName,
}: SectorCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow duration-150 ease-[ease]',
        className,
      )}
    >
      <CardContent className="flex flex-col gap-4 p-6">
        <Icon
          className={cn('h-8 w-8 stroke-primary', iconClassName)}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <div className="flex flex-col gap-1.5">
          <span className={cn('font-semibold text-foreground leading-tight', titleClassName)}>
            {nome}
          </span>
          <span className={cn('text-sm text-muted-foreground', metaClassName)}>
            {categorieCount} {categorieCount === 1 ? 'categoria' : 'categorie'}
          </span>
        </div>
        <Badge
          variant={fase === 'CORE' ? 'default' : 'secondary'}
          className={cn('w-fit', badgeClassName)}
        >
          {fase === 'CORE' ? 'Core' : 'Adiacente'}
        </Badge>
      </CardContent>
    </Card>
  )
}
