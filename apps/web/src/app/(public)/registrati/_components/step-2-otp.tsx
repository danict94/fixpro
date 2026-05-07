'use client'

import type { FormEvent, ReactNode } from 'react'
import { Button, Input, cn } from '@fixpro/ui'

interface Step2Props {
  telefono: string
  otp: string
  onOtp: (v: string) => void
  error: string | null
  loading: boolean
  cooldown: number
  otpSent: boolean
  onSendOtp: () => Promise<boolean>
  onSubmit: (event: FormEvent) => void
}

export function Step2Otp({
  telefono,
  otp,
  onOtp,
  error,
  loading,
  cooldown,
  otpSent,
  onSendOtp,
  onSubmit,
}: Step2Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="feature-panel px-6 py-8 text-center sm:px-8">
        <p className="text-primary text-[12px] font-semibold tracking-[0.12em] uppercase">
          Verifica telefono
        </p>

        <p className="muted-copy mt-3 text-sm leading-6">
          Abbiamo inviato un codice di verifica al numero
        </p>

        <p className="text-secondary mt-1 text-base font-semibold">{telefono}</p>
      </div>

      <div className="surface-card px-5 py-6 sm:px-6">
        <Field label="Codice OTP" htmlFor="otp">
          <Input
            id="otp"
            value={otp}
            onChange={(event) => onOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="rounded-full text-center text-lg tracking-[0.35em]"
          />
        </Field>

        {error && (
          <div className="border-danger/20 bg-danger/10 mt-4 rounded-[18px] border px-4 py-3">
            <p className="text-danger text-sm font-medium" role="alert">
              {error}
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="primary-pill mt-5 w-full px-5 py-3"
          disabled={loading || otp.length < 6}
        >
          {loading ? 'Verifica in corso...' : 'Verifica codice'}
        </Button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onSendOtp}
            disabled={cooldown > 0}
            className="text-primary disabled:text-muted-foreground text-sm font-semibold hover:underline disabled:cursor-not-allowed disabled:no-underline"
          >
            {cooldown > 0
              ? `Reinvia codice (${cooldown}s)`
              : otpSent
                ? 'Non hai ricevuto il codice? Reinvia'
                : 'Invia codice'}
          </button>
        </div>
      </div>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="text-secondary text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}
