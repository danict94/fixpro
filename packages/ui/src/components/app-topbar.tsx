'use client'

import * as React from 'react'

export interface AppTopBarProps {
  pageTitle: string
  user: { name: string }
}

export function AppTopBar({ pageTitle, user }: AppTopBarProps) {
  const firstName = user.name.split(' ')[0] ?? user.name
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>

      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-sm text-muted-foreground">
          Ciao, <span className="font-medium text-foreground">{firstName}</span>!
        </span>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          aria-hidden="true"
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
