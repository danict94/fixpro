import * as React from 'react'
import { cn } from '../lib/cn'

// UX protocol: sempre skeleton invece di spinner nudi

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }
