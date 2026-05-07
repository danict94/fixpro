'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@fixpro/ui'

interface Step3Props {
  email: string
  onResend: () => Promise<void>
}

export function Step3EmailSent({ email, onResend }: Step3Props) {
  const [resent, setResent] = useState(false)

  async function handleResend() {
    await onResend()
    setResent(true)
  }

  return (
    <div className="space-y-5 py-2 text-center">
      <div className="feature-panel px-6 py-10 sm:px-8">
        <div className="ring-border/60 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-card shadow-sm ring-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>

        <h2 className="text-secondary mt-4 text-lg font-semibold">Controlla la tua email</h2>

        <p className="muted-copy mt-2 text-sm">Abbiamo inviato un link di attivazione a</p>

        <p className="text-secondary mt-1 font-medium">{email}</p>

        <p className="muted-copy mt-2 text-sm leading-6">
          Clicca il link nell&apos;email per attivare il tuo account.
        </p>
      </div>

      <div className="surface-card px-5 py-5 sm:px-6">
        <div className="space-y-3">
          <Link href="/accedi" className="block">
            <Button className="primary-pill w-full px-5 py-3">Vai al login</Button>
          </Link>

          <button
            type="button"
            onClick={handleResend}
            disabled={resent}
            className="text-primary disabled:text-muted-foreground w-full text-sm font-semibold hover:underline disabled:cursor-not-allowed disabled:no-underline"
          >
            {resent ? 'Email reinviata' : "Non hai ricevuto l'email? Reinvia"}
          </button>
        </div>
      </div>
    </div>
  )
}
