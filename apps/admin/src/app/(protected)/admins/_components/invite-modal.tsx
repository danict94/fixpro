'use client'

import { useState } from 'react'
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

interface Props {
  open: boolean
  isPending: boolean
  onClose: () => void
  onInvite: (email: string, role: 'SUPER_ADMIN' | 'ADMIN') => void
}

export function InviteModal({ open, isPending, onClose, onInvite }: Props) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'SUPER_ADMIN' | 'ADMIN'>('ADMIN')

  if (!open) return null

  const handleSubmit = () => {
    if (!email.trim()) return
    onInvite(email.trim(), role)
  }

  const handleClose = () => {
    setEmail('')
    setRole('ADMIN')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/25 p-4 backdrop-blur-[2px]">
      <Card className="surface-card w-full max-w-md border-0 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-secondary">Invita admin</CardTitle>
          <CardDescription className="muted-copy leading-6">
            Assegna un ruolo amministrativo e invia un&apos;email per configurare l&apos;accesso.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary">Email</label>
            <Input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={isPending}
              autoFocus
              className="rounded-full"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary">Ruolo</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'SUPER_ADMIN' | 'ADMIN')}
              disabled={isPending}
              className="flex h-11 w-full rounded-full border border-input bg-background px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="w-full rounded-full sm:w-auto"
          >
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isPending}
            disabled={!email.trim()}
            className="primary-pill w-full px-5 sm:w-auto"
          >
            Invia accesso
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
