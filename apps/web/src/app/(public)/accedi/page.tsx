'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@fixpro/ui'
import { authClient } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc/client'

type LoginStep = 'email' | 'password' | 'passwordless' | 'sms'

type LoginMethod =
  | { status: 'password'; email: string }
  | { status: 'passwordless'; email: string; canUseSms: boolean }
  | null

function getSafeRedirect(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null
  }

  return value
}

function getDefaultRedirect(user: Record<string, unknown> | undefined) {
  const role = user?.role as string | undefined
  const emailVerified = (user?.emailVerified as boolean | undefined) ?? false
  const phoneNumberVerified = (user?.phoneNumberVerified as boolean | undefined) ?? false

  if (!emailVerified || !phoneNumberVerified) {
    return '/verifica'
  }

  return role === 'COMPANY' ? '/area-impresa/dashboard' : '/area-cliente'
}

export default function AccediPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const loginMethod = trpc.auth.loginMethod.useMutation()

  const redirectTo = useMemo(
    () =>
      getSafeRedirect(searchParams.get('redirect')) ??
      getSafeRedirect(searchParams.get('callbackUrl')),
    [searchParams],
  )

  const [step, setStep] = useState<LoginStep>('email')
  const [method, setMethod] = useState<LoginMethod>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const normalizedEmail = email.toLowerCase().trim()

  function resetToEmail() {
    setStep('email')
    setMethod(null)
    setPassword('')
    setOtp('')
    setError(null)
    setNotice(null)
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)

    try {
      const result = await loginMethod.mutateAsync({ email: normalizedEmail })

      if (result.status === 'not_found') {
        setError('Non abbiamo trovato un account con questa email.')
        return
      }

      setMethod(result)
      setStep(result.status === 'password' ? 'password' : 'passwordless')
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message
      setError(message ?? 'Non siamo riusciti a controllare questo account.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)

    const result = await authClient.signIn.email({
      email: normalizedEmail,
      password,
    })

    setLoading(false)

    if (result.error) {
      setError('Credenziali non valide. Controlla email e password.')
      return
    }

    const user = result.data?.user as Record<string, unknown> | undefined
    router.push(redirectTo ?? getDefaultRedirect(user))
    router.refresh()
  }

  async function handleMagicLink() {
    setError(null)
    setNotice(null)
    setLoading(true)

    const result = await authClient.signIn.magicLink({
      email: normalizedEmail,
      callbackURL: redirectTo ?? '/area-cliente',
      errorCallbackURL: '/accedi',
    })

    setLoading(false)

    if (result.error) {
      setError('Non siamo riusciti a inviare il link. Riprova tra poco.')
      return
    }

    setNotice('Ti abbiamo inviato un link di accesso. Controlla la tua email.')
  }

  async function handleStartSms() {
    setError(null)
    setNotice(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/passwordless-sms/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      })

      const data = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) {
        setError(data.error ?? 'Non siamo riusciti a inviare il codice SMS.')
        return
      }

      setOtp('')
      setStep('sms')
      setNotice('Codice SMS inviato.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifySms(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/passwordless-sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          code: otp,
          ...(redirectTo ? { redirectTo } : {}),
        }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        redirectTo?: string
      }

      if (!response.ok) {
        setError(data.error ?? 'Codice non valido o scaduto.')
        return
      }

      router.push(data.redirectTo ?? redirectTo ?? '/area-cliente')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center text-2xl font-bold">Accedi</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              Inserisci la tua email per continuare.
            </p>
          </CardHeader>

          <CardContent>
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@esempio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={(e) => setEmail(e.target.value.toLowerCase().trim())}
                    required
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <p className="text-sm text-danger" role="alert">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading || !normalizedEmail}>
                  {loading ? 'Controllo account...' : 'Continua'}
                </Button>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                  {method?.email}
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:underline"
                    onClick={resetToEmail}
                  >
                    Cambia email
                  </button>

                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Password dimenticata?
                  </Link>
                </div>

                {error && (
                  <p className="text-sm text-danger" role="alert">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading || !password}>
                  {loading ? 'Accesso in corso...' : 'Accedi'}
                </Button>
              </form>
            )}

            {step === 'passwordless' && method?.status === 'passwordless' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                  {method.email}
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    className="w-full"
                    disabled={loading}
                    onClick={handleMagicLink}
                  >
                    {loading ? 'Invio in corso...' : 'Ricevi link via email'}
                  </Button>

                  {method.canUseSms && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={loading}
                      onClick={handleStartSms}
                    >
                      Ricevi codice via SMS
                    </Button>
                  )}
                </div>

                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground hover:underline"
                  onClick={resetToEmail}
                >
                  Usa un&apos;altra email
                </button>

                {notice && (
                  <p
                    className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success"
                    role="status"
                  >
                    {notice}
                  </p>
                )}

                {error && (
                  <p className="text-sm text-danger" role="alert">
                    {error}
                  </p>
                )}
              </div>
            )}

            {step === 'sms' && (
              <form onSubmit={handleVerifySms} className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                  {normalizedEmail}
                </div>

                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium">
                    Codice SMS
                  </label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="text-center tracking-widest"
                    required
                  />
                </div>

                <button
                  type="button"
                  className="w-full text-sm text-primary hover:underline"
                  onClick={handleStartSms}
                  disabled={loading}
                >
                  Invia di nuovo il codice
                </button>

                {notice && (
                  <p
                    className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success"
                    role="status"
                  >
                    {notice}
                  </p>
                )}

                {error && (
                  <p className="text-sm text-danger" role="alert">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? 'Verifica in corso...' : 'Accedi'}
                </Button>
              </form>
            )}

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Non hai un account?{' '}
              <Link href="/registrati" className="font-medium text-primary hover:underline">
                Registrati
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}