'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Check } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
} from '@fixpro/ui'

function ReimpostaPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [requested, setRequested] = useState(false)

  // Cattura il token una sola volta al mount — useSearchParams è reattivo
  // e si aggiorna quando replaceState rimuove il token dall'URL
  const [token] = useState(() => searchParams?.get('token') ?? null)

  useEffect(() => {
    if (token) {
      window.history.replaceState({}, '', '/reimposta-password')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRequestReset = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Inserisci la tua email')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error('Errore durante la richiesta')
      }

      setRequested(true)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la richiesta')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!token) {
      setError('Token non valido o mancante')
      return
    }

    if (password.length < 8) {
      setError('La password deve avere almeno 8 caratteri')
      return
    }

    if (password !== confirmPassword) {
      setError('Le password non coincidono')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Errore durante il reset della password')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/accedi'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il reset della password')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Recupera accesso</CardTitle>
            <CardDescription>
              Inserisci la tua email admin per ricevere un link di reset
            </CardDescription>
          </CardHeader>

          <CardContent>
            {requested ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                    <Check className="h-6 w-6 text-success" />
                  </div>
                </div>

                <div>
                  <p className="font-medium text-success">Richiesta inviata!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Se l&apos;email è corretta, riceverai un link. Controlla
                    anche spam o riprova.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestReset} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-3 rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@fixpro.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  loading={loading}
                  disabled={loading || !email.trim()}
                >
                  Invia link di reset
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter>
            <Link href="/accedi" className="w-full">
              <Button variant="outline" className="w-full">
                Torna al login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Configura la tua password</CardTitle>
          <CardDescription>
            Hai ricevuto un invito per diventare amministratore FixPro
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <Check className="h-6 w-6 text-success" />
                </div>
              </div>

              <div>
                <p className="font-medium text-success">
                  Password impostata con successo!
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reindirizzamento al login...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="flex items-center gap-3 rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimo 8 caratteri"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Usa almeno 8 caratteri, lettere, numeri e simboli
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium"
                >
                  Conferma password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ripeti la password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={loading || password.length < 8 || password !== confirmPassword}
              >
                Imposta password
              </Button>
            </form>
          )}
        </CardContent>

        {!success && (
          <CardFooter className="flex justify-center text-xs text-muted-foreground">
            <p>
              Torna al{' '}
              <Link href="/accedi" className="text-primary hover:underline">
                login
              </Link>{' '}
              se hai già una password
            </p>
          </CardFooter>
        )}
      </Card>
    </main>
  )
}

function ReimpostaPasswordFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <p className="text-sm font-medium text-secondary">Caricamento...</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Stiamo preparando la pagina di reimpostazione password.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

export default function ReimpostaPasswordPage() {
  return (
    <Suspense fallback={<ReimpostaPasswordFallback />}>
      <ReimpostaPasswordContent />
    </Suspense>
  )
}