'use client'

import * as React from 'react'

export interface AppShellProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function AppShell({ sidebar, children }: AppShellProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen bg-muted">

      {/* MOBILE TOP BAR */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-background border-b border-border md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="text-secondary"
        >
          ☰
        </button>

        <span className="font-semibold text-secondary">
          Fix<span className="text-primary">Pro</span>
        </span>

        <div className="w-6" />
      </div>

      {/* SIDEBAR DESKTOP */}
      <div className="hidden md:flex md:w-[260px] md:shrink-0 border-r border-border bg-background">
        {sidebar}
      </div>

      {/* SIDEBAR MOBILE */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 z-50 w-[260px] bg-background shadow-xl md:hidden">
            {React.isValidElement(sidebar)
              ? React.cloneElement(sidebar as any, {
                  onClose: () => setOpen(false),
                })
              : sidebar}
          </div>
        </>
      )}

      {/* CONTENT */}
      <main className="flex-1 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}