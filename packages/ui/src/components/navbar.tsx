'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Zap } from 'lucide-react'
import { cn } from '../lib/cn'

const navLinks = [
  { href: '/#come-funziona', label: 'Come funziona' },
  { href: '/categorie', label: 'Settori' },
  { href: '/#imprese', label: 'Per le imprese' },
  { href: '/interventi', label: 'Guida ai prezzi' },
]

interface NavbarProps {
  userAreaHref?: string
  userAreaLabel?: string
  creditBalance?: number
  onSignOut?: () => void
}

export function Navbar({
  userAreaHref,
  userAreaLabel,
  creditBalance,
  onSignOut,
}: NavbarProps = {}) {
  const [open, setOpen] = useState(false)

  const isLoggedIn = !!userAreaHref

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/88">
      <div className="page-container">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 text-[20px] font-bold tracking-tight text-secondary transition-opacity duration-150 hover:opacity-80"
            aria-label="FixPro"
          >
            Fix<span className="text-primary">Pro</span>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden flex-1 items-center gap-6 md:flex"
            aria-label="Navigazione principale"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-secondary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden shrink-0 items-center gap-5 md:flex">
            {isLoggedIn ? (
              <>
                {creditBalance !== undefined && (
                  <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5">
                    <Zap className="h-4 w-4 stroke-primary" strokeWidth={2} />
                    <span className="text-sm font-semibold text-primary">
                      {creditBalance} cr
                    </span>
                  </div>
                )}

                <Link
                  href={userAreaHref}
                  className="text-sm font-semibold text-primary transition-colors duration-150 hover:text-primary/80"
                >
                  {userAreaLabel}
                </Link>

                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-secondary"
                  >
                    Esci
                  </button>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/accedi"
                  className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-secondary"
                >
                  Accedi
                </Link>

                <Link
                  href="/registrati"
                  className="primary-pill px-4 py-2 text-sm font-semibold"
                >
                  Registrati
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="rounded-full p-2 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-secondary md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Chiudi menu' : 'Apri menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={cn(
          'overflow-hidden border-t border-border bg-background transition-all duration-150 ease-[ease] md:hidden',
          open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0',
        )}
        aria-hidden={!open}
      >
        <nav
          className="page-container flex flex-col gap-1 py-4"
          aria-label="Navigazione mobile"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-[22px] px-4 py-3 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-secondary"
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile CTA */}
          <div className="mt-2 flex flex-col gap-4 border-t border-border px-1 pt-4">
            {isLoggedIn ? (
              <>
                {creditBalance !== undefined && (
                  <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5">
                    <Zap className="h-4 w-4 stroke-primary" strokeWidth={2} />
                    <span className="text-sm font-semibold text-primary">
                      {creditBalance} cr
                    </span>
                  </div>
                )}

                <Link
                  href={userAreaHref}
                  onClick={() => setOpen(false)}
                  className="text-sm font-semibold text-primary transition-colors duration-150 hover:text-primary/80"
                >
                  {userAreaLabel}
                </Link>

                {onSignOut && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      onSignOut()
                    }}
                    className="text-left text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-secondary"
                  >
                    Esci
                  </button>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/accedi"
                  className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-secondary"
                  onClick={() => setOpen(false)}
                >
                  Accedi
                </Link>

                <Link
                  href="/registrati"
                  className="primary-pill px-4 py-2.5 text-sm font-semibold"
                  onClick={() => setOpen(false)}
                >
                  Registrati
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}