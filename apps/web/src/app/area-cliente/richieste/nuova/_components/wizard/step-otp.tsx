'use client'

import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button, Input } from '@fixpro/ui'

interface StepOtpProps {
  error: string | null
  loading: boolean
  isUploadingRequestImages: boolean
  otp: string
  setOtp: Dispatch<SetStateAction<string>>
  otpCooldown: number
  contactEmail: string
  contactPhone: string
  sentViaSms: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  onResendOtp: () => void | Promise<void>
}

export function StepOtp({
  error,
  loading,
  isUploadingRequestImages,
  otp,
  setOtp,
  otpCooldown,
  contactEmail,
  contactPhone,
  sentViaSms,
  onSubmit,
  onResendOtp,
}: StepOtpProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="feature-panel space-y-5 px-5 py-6 text-center sm:px-6">
        <div className="space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-7 w-7 stroke-primary" aria-hidden="true" />
          </div>
          <p className="font-medium text-secondary">Controlla il tuo telefono</p>
          {sentViaSms && contactPhone.trim() ? (
            <p className="muted-copy text-sm">
              Abbiamo inviato un codice via SMS a{' '}
              <span className="font-medium text-secondary">{contactPhone}</span>.
            </p>
          ) : (
            <p className="muted-copy text-sm">
              Inserisci il numero che hai confermato e richiedi di nuovo il codice via SMS.
            </p>
          )}
          {contactEmail.trim() && (
            <p className="muted-copy text-xs">
              Useremo <span className="font-medium text-secondary">{contactEmail}</span> solo per le comunicazioni del tuo account e della richiesta.
            </p>
          )}
        </div>
      </div>

      <div className="surface-card border-0 px-5 py-5 shadow-none">
        <div className="space-y-1.5">
          <label htmlFor="otp" className="text-sm font-medium text-secondary">Codice di verifica <span className="text-danger">*</span></label>
          <Input
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            className="rounded-2xl border-border bg-white text-center text-2xl font-bold tracking-widest"
          />
        </div>

        <p className="muted-copy text-center text-xs">
          Non hai ricevuto il codice?{' '}
          {otpCooldown > 0 ? (
            <span className="muted-copy">Invia di nuovo in {otpCooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={onResendOtp}
              disabled={loading}
              className="secondary-link disabled:opacity-50"
            >
              Invia di nuovo
            </button>
          )}
        </p>

        {error && <p className="rounded-[18px] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">{error}</p>}
        <Button type="submit" className="primary-pill h-11 w-full text-sm font-semibold" disabled={loading || otp.length !== 6}>
          {loading || isUploadingRequestImages ? 'Verifica in corso...' : 'Verifica e invia richiesta'}
        </Button>
      </div>
    </form>
  )
}
