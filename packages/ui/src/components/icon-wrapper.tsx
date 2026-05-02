import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/cn'
import { iconToneClass, iconBgClass, type Tone, type IconColorMode } from '../lib/tone'

export interface IconWrapperProps {
  icon: LucideIcon
  tone: Tone
  /** Mostra lo sfondo colorato attorno all'icona. Default: true */
  background?: boolean
  /** Come viene colorata l'icona SVG. Default: 'stroke' */
  mode?: IconColorMode
  size?: 'sm' | 'md' | 'lg'
  className?: string
  iconClassName?: string
  strokeWidth?: number
}

const SIZE_MAP = {
  sm: { wrap: 'h-8 w-8 rounded-lg',   icon: 'h-4 w-4' },
  md: { wrap: 'h-10 w-10 rounded-xl',  icon: 'h-5 w-5' },
  lg: { wrap: 'h-12 w-12 rounded-xl',  icon: 'h-6 w-6' },
}

export function IconWrapper({
  icon: Icon,
  tone,
  background = true,
  mode = 'stroke',
  size = 'md',
  className,
  iconClassName,
  strokeWidth = 1.8,
}: IconWrapperProps) {
  const s = SIZE_MAP[size]
  const colorClass = iconToneClass(tone, mode)

  if (!background) {
    return (
      <Icon
        className={cn(s.icon, colorClass, iconClassName, className)}
        strokeWidth={strokeWidth}
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center',
        s.wrap,
        iconBgClass(tone),
        className,
      )}
    >
      <Icon
        className={cn(s.icon, colorClass, iconClassName)}
        strokeWidth={strokeWidth}
        aria-hidden="true"
      />
    </div>
  )
}
