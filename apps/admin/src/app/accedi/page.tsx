'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@fixpro/ui'
import { Input } from '@fixpro/ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@fixpro/ui'
import { AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const logLoginMutation = trpc.adminUsers.logLogin.useMutation()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Inserisci email e password')
      return
    }

    setLoading(true)

    const result = await authClient.signIn.email({ email, password })

    if (result.error) {
      setError('Credenziali non valide.')
      setLoading(false)
      return
    }

    const session = await authClient.getSession()
    const adminRole = (session.data?.user as Record<string, unknown>)?.adminRole as string | null

    if (!adminRole) {
      await authClient.signOut()
      setError('Accesso non autorizzato.')
      setLoading(false)
      return
    }

    // Audit login — fire-and-forget, non blocca navigazione
    logLoginMutation.mutate()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Pannello Admin</CardTitle>
          <CardDescription>Accedi al sistema di amministrazione</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-danger/10 border border-danger p-3 text-danger text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="text-right">
              <Link
                href="/reimposta-password"
                className="text-sm text-primary hover:underline"
              >
                Hai dimenticato la password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading || !email || !password}
            >
              Accedi
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center text-xs text-muted-foreground">
          <p>Hai ricevuto un invito? Controlla la tua email per il link di configurazione.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
