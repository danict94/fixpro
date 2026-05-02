'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@fixpro/ui'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const invalidToken = searchParams.get('error') === 'INVALID_TOKEN' || !token

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('Il link di reset non è valido o è scaduto.')
      return
    }

    if (newPassword.length < 8) {
      setError('La nuova password deve essere di almeno 8 caratteri.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Le password non coincidono.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      })

      if (!response.ok) {
        setError('Il link di reset non è valido o è scaduto.')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/accedi')
      }, 1500)
    } catch {
      setError('Si è verificato un errore. Riprova tra poco.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center text-2xl font-bold">Reimposta password</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              Scegli una nuova password sicura di almeno 8 caratteri.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {invalidToken ? (
              <div className="space-y-4">
                <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  Il link di reset non è valido o è scaduto.
                </p>
                <Link href="/forgot-password" className="block text-center text-sm font-medium text-primary hover:underline">
                  Richiedi un nuovo link
                </Link>
              </div>
            ) : success ? (
              <div className="space-y-4">
                <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                  Password aggiornata con successo. Ti stiamo riportando al login.
                </p>
                <Link href="/accedi" className="block text-center text-sm font-medium text-primary hover:underline">
                  Vai al login
                </Link>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="new-password" className="text-sm font-medium">
                      Nuova password
                    </label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="text-sm font-medium">
                      Conferma nuova password
                    </label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || !token}>
                    {loading ? 'Aggiornamento…' : 'Aggiorna password'}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  <Link href="/accedi" className="font-medium text-primary hover:underline">
                    Torna al login
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
