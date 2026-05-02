'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@fixpro/ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const redirectTo = `${window.location.origin}/reset-password`
      await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          redirectTo,
        }),
      })
      setSubmitted(true)
    } catch {
      setError('Si è verificato un errore temporaneo. Riprova tra poco.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center text-2xl font-bold">Password dimenticata?</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              Inserisci la tua email e ti invieremo un link per reimpostare la password.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {submitted ? (
              <div className="space-y-4">
                <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                  Se l&apos;email esiste, riceverai un link per reimpostare la password.
                </p>
                <Link href="/accedi" className="block text-center text-sm font-medium text-primary hover:underline">
                  Torna al login
                </Link>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                      autoComplete="email"
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Invio in corso…' : 'Invia link di reset'}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  Hai ricordato la password?{' '}
                  <Link href="/accedi" className="font-medium text-primary hover:underline">
                    Accedi
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
