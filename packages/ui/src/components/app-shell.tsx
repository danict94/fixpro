'use client'

import * as React from 'react'

export interface AppShellProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function AppShell({ sidebar, children }: AppShellProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="bg-muted flex min-h-screen">
      {/* MOBILE TOP BAR */}
      <div className="bg-background border-border fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b px-4 md:hidden">
        <button onClick={() => setOpen(true)} className="text-secondary">
          ☰
        </button>

        <span className="text-secondary font-semibold">
          Fix<span className="text-primary">Pro</span>
        </span>

        <div className="w-6" />
      </div>

      {/* SIDEBAR DESKTOP */}
      <div className="border-border bg-background hidden border-r md:flex md:w-[260px] md:shrink-0">
        {sidebar}
      </div>

      {/* SIDEBAR MOBILE */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="bg-background fixed inset-y-0 left-0 z-50 w-[260px] shadow-xl md:hidden">
            {React.isValidElement<{ onClose?: () => void }>(sidebar)
              ? React.cloneElement(sidebar, {
                  onClose: () => setOpen(false),
                })
              : sidebar}
          </div>
        </>
      )}

      {/* CONTENT */}
      <main className="flex-1 pt-14 md:pt-0">{children}</main>
    </div>
  )
}
