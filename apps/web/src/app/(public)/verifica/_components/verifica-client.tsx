'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@fixpro/ui'
import { authClient } from '@/lib/auth-client'

const OTP_COOLDOWN = 60

interface VerificaClientProps {
  email: string
  role: string
  emailVerified: boolean
  phoneNumberVerified: boolean
  phoneNumber: string
}

export function VerificaClient({
  email,
  role,
  emailVerified,
  phoneNumberVerified,
  phoneNumber,
}: VerificaClientProps) {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [emailResent, setEmailResent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function handleSendOtp() {
    setOtpError(null)
    const result = await authClient.phoneNumber.sendOtp({ phoneNumber })
    if (!result.error) {
      setOtpSent(true)
      setCooldown(OTP_COOLDOWN)
    } else {
      setOtpError('Impossibile inviare il codice. Riprova.')
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setOtpError(null)
    setOtpLoading(true)

    const result = await authClient.phoneNumber.verify({
      phoneNumber,
      code: otp,
    })

    setOtpLoading(false)

    if (result.error) {
      setOtpError('Codice non valido o scaduto. Riprova.')
      return
    }

    // Reload the page to re-check session and possibly redirect
    router.refresh()
  }

  async function handleResendEmail() {
    setEmailError(null)
    const result = await authClient.sendVerificationEmail({
      email,
      callbackURL: role === 'COMPANY' ? '/area-impresa/dashboard' : '/area-cliente/richieste',
    })
    if (!result.error) {
      setEmailResent(true)
    } else {
      setEmailError('Impossibile inviare l\'email. Riprova tra poco.')
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-center">
          Verifica il tuo account
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Completa le verifiche per accedere alla tua area riservata.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Email verification status */}
        <VerificationRow
          label="Verifica email"
          detail={email}
          verified={emailVerified}
        >
          {!emailVerified && (
            <div className="space-y-2 mt-2">
              {emailError && (
                <p className="text-sm text-danger" role="alert">{emailError}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendEmail}
                disabled={emailResent}
                className="w-full"
              >
                {emailResent ? 'Email inviata' : 'Invia email di verifica'}
              </Button>
            </div>
          )}
        </VerificationRow>

        {/* Phone verification status */}
        <VerificationRow
          label="Verifica telefono"
          detail={phoneNumber}
          verified={phoneNumberVerified}
        >
          {!phoneNumberVerified && (
            <div className="space-y-3 mt-2">
              {otpSent && (
                <form onSubmit={handleVerifyOtp} className="space-y-2">
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Codice OTP (6 cifre)"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="text-center tracking-widest"
                  />
                  {otpError && (
                    <p className="text-sm text-danger" role="alert">{otpError}</p>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    className="w-full"
                    disabled={otpLoading || otp.length < 6}
                  >
                    {otpLoading ? 'Verifica in corso…' : 'Verifica codice'}
                  </Button>
                </form>
              )}

              {!otpSent && otpError && (
                <p className="text-sm text-danger" role="alert">{otpError}</p>
              )}

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={cooldown > 0}
                className="w-full text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
              >
                {cooldown > 0
                  ? `Reinvia codice (${cooldown}s)`
                  : otpSent
                    ? 'Non hai ricevuto il codice? Reinvia'
                    : 'Invia codice di verifica'}
              </button>
            </div>
          )}
        </VerificationRow>
      </CardContent>
    </Card>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface VerificationRowProps {
  label: string
  detail: string
  verified: boolean
  children?: React.ReactNode
}

function VerificationRow({ label, detail, verified, children }: VerificationRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </div>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            verified
              ? 'bg-success/10 text-success'
              : 'bg-warning/10 text-warning'
          }`}
          aria-label={verified ? 'Verificato' : 'Non verificato'}
        >
          {verified ? '✓' : '!'}
        </span>
      </div>
      {children}
    </div>
  )
}
