'use client'

import Link from 'next/link'
import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import { Button, Input } from '@fixpro/ui'

interface StepGuestAccountProps {
  error: string | null
  loading: boolean
  contactEmail: string
  setContactEmail: Dispatch<SetStateAction<string>>
  privacyAccepted: boolean
  setPrivacyAccepted: Dispatch<SetStateAction<boolean>>
  emailAlreadyRegistered: boolean
  setEmailAlreadyRegistered: Dispatch<SetStateAction<boolean>>
  onSubmit: FormEventHandler<HTMLFormElement>
}

export function StepGuestAccount({
  error,
  loading,
  contactEmail,
  setContactEmail,
  privacyAccepted,
  setPrivacyAccepted,
  emailAlreadyRegistered,
  setEmailAlreadyRegistered,
  onSubmit,
}: StepGuestAccountProps) {
  return (
    <div className="space-y-5">
      <div className="surface-section space-y-5 px-5 py-5 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-secondary">Crea il tuo accesso FixPro</p>
          <p className="muted-copy mt-1 text-sm">
            Inserisci l&apos;email a cui vuoi ricevere le risposte. Il codice di verifica verrà
            inviato via SMS al numero inserito prima.
          </p>
        </div>

        {emailAlreadyRegistered ? (
          <div className="space-y-3 rounded-[18px] border border-warning/30 bg-warning/5 px-4 py-4">
            <div>
              <p className="text-sm font-medium text-secondary">Hai già un account FixPro.</p>
              <p className="muted-copy mt-0.5 text-sm">
                L&apos;email <span className="font-medium text-secondary">{contactEmail}</span> è
                già registrata. Accedi con link email o codice SMS per continuare.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/accedi?redirect=${encodeURIComponent('/area-cliente/richieste/nuova')}`}
                className="primary-pill px-4 py-2.5 text-sm font-medium"
              >
                Accedi al tuo account
              </Link>

              <button
                type="button"
                onClick={() => {
                  setEmailAlreadyRegistered(false)
                  setContactEmail('')
                }}
                className="secondary-link justify-center text-sm"
              >
                Usa un&apos;altra email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="guestEmail" className="text-sm font-medium text-secondary">
                Email <span className="text-danger">*</span>
              </label>

              <Input
                id="guestEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                onBlur={(e) => setContactEmail(e.target.value.toLowerCase().trim())}
                placeholder="mario@esempio.it"
                required
                autoComplete="email"
                className="rounded-2xl border-border bg-white"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-[18px] border border-border bg-muted px-4 py-3">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />

              <span className="text-sm text-secondary">
                Ho letto e accetto la{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-primary underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </Link>
              </span>
            </label>

            {error && (
              <p
                className="rounded-[18px] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
                role="alert"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="primary-pill h-11 w-full text-sm font-semibold"
              disabled={loading}
            >
              {loading ? 'Invio codice SMS...' : 'Invia codice via SMS'}
            </Button>

            <p className="muted-copy text-xs">
              Dopo la verifica del telefono ti invieremo un link di accesso via email.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}