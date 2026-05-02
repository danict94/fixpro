'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, KeyRound, Trash2, AlertTriangle, Lock, Mail, Phone } from 'lucide-react'
import { Button, Input } from '@fixpro/ui'
import { authClient } from '@/lib/auth-client'

interface ProfiloClienteProps {
  name:   string
  email:  string
  phone:  string | null
  hasPassword: boolean
}

export function ProfiloCliente({ name, email, phone, hasPassword }: ProfiloClienteProps) {
  const router = useRouter()

  // Cambio password
  const [passwordConfigured, setPasswordConfigured] = useState(hasPassword)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError]     = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)
    if (newPassword.length < 8) { setPwError('La nuova password deve essere di almeno 8 caratteri.'); return }
    if (newPassword !== confirmPassword) { setPwError('Le password non coincidono.'); return }
    setPwLoading(true)
    try {
      const res = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: false })
      if (res.error) {
        setPwError(res.error.message ?? 'Password attuale non corretta.')
      } else {
        setPwSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPwSuccess(false), 4000)
      }
    } catch {
      setPwError('Si è verificato un errore. Riprova.')
    } finally {
      setPwLoading(false)
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)
    if (newPassword.length < 8) { setPwError('La nuova password deve essere di almeno 8 caratteri.'); return }
    if (newPassword !== confirmPassword) { setPwError('Le password non coincidono.'); return }
    setPwLoading(true)
    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        setPwError(data.error ?? 'Non siamo riusciti a impostare la password.')
      } else {
        setPwSuccess(true)
        setPasswordConfigured(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPwSuccess(false), 4000)
      }
    } catch {
      setPwError('Si e verificato un errore. Riprova.')
    } finally {
      setPwLoading(false)
    }
  }

  // Eliminazione account
  const [deleteConfirm, setDeleteConfirm]   = useState('')
  const [deleteError, setDeleteError]       = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading]   = useState(false)
  const DELETE_KEYWORD = 'ELIMINA'

  async function handleDeleteAccount() {
    if (deleteConfirm !== DELETE_KEYWORD) return
    setDeleteError(null)
    setDeleteLoading(true)
    try {
      const res = await authClient.deleteUser()
      if (res.error) {
        setDeleteError(res.error.message ?? "Impossibile eliminare l'account.")
      } else {
        router.push('/')
      }
    } catch {
      setDeleteError('Si è verificato un errore. Riprova.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">

      {/* Dati account (read-only) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-4 w-4 stroke-primary" strokeWidth={1.9} />
          </div>
          <div>
            <p className="font-semibold text-foreground">Dati account</p>
            <p className="text-xs text-muted-foreground">Per modificare email o telefono scrivi al supporto.</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 stroke-muted-foreground shrink-0" strokeWidth={1.9} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome</p>
              <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 stroke-muted-foreground shrink-0" strokeWidth={1.9} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
              <p className="text-sm font-semibold text-foreground truncate">{email}</p>
            </div>
            <Lock className="h-3.5 w-3.5 stroke-muted-foreground shrink-0" strokeWidth={2} />
          </div>
          {phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 stroke-muted-foreground shrink-0" strokeWidth={1.9} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Telefono</p>
                <p className="text-sm font-semibold text-foreground truncate">{phone}</p>
              </div>
              <Lock className="h-3.5 w-3.5 stroke-muted-foreground shrink-0" strokeWidth={2} />
            </div>
          )}
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Password */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <KeyRound className="h-4 w-4 stroke-primary" strokeWidth={1.9} />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {passwordConfigured ? 'Cambia password' : 'Vuoi impostare una password?'}
            </p>
            <p className="text-xs text-muted-foreground">
              {passwordConfigured
                ? 'Scegli una password sicura di almeno 8 caratteri.'
                : 'Potrai continuare a usare link e codici, oppure accedere con email e password.'}
            </p>
          </div>
        </div>

        <form onSubmit={passwordConfigured ? handleChangePassword : handleSetPassword} className="space-y-4">
          {passwordConfigured && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="current-pw">Password attuale</label>
              <Input id="current-pw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="new-pw">Nuova password</label>
            <Input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="confirm-pw">Conferma nuova password</label>
            <Input id="confirm-pw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
          </div>

          {pwError   && <p className="text-sm text-danger">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-success">Password aggiornata con successo.</p>}

          <Button type="submit" disabled={pwLoading} className="min-w-40">
            {pwLoading ? 'Salvataggio...' : passwordConfigured ? 'Aggiorna password' : 'Imposta password'}
          </Button>
        </form>
      </section>

      <div className="border-t border-border" />

      {/* Elimina account */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10">
            <Trash2 className="h-4 w-4 stroke-danger" strokeWidth={1.9} />
          </div>
          <div>
            <p className="font-semibold text-foreground">Elimina account</p>
            <p className="text-xs text-muted-foreground">Azione irreversibile. Tutti i dati verranno eliminati permanentemente.</p>
          </div>
        </div>

        <div className="rounded-xl border border-danger/20 bg-danger/5 p-5 space-y-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 stroke-danger shrink-0 mt-0.5" strokeWidth={1.9} />
            <p className="text-sm text-danger">
              Verranno eliminati il tuo account, tutte le richieste inviate e la cronologia dei contatti. L&apos;azione non può essere annullata.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="delete-confirm">
              Digita <span className="font-mono font-bold">{DELETE_KEYWORD}</span> per confermare
            </label>
            <Input
              id="delete-confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={DELETE_KEYWORD}
              className="font-mono"
            />
          </div>
          {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
          <Button
            type="button"
            variant="destructive"
            disabled={deleteConfirm !== DELETE_KEYWORD || deleteLoading}
            onClick={handleDeleteAccount}
          >
            {deleteLoading ? 'Eliminazione…' : 'Elimina il mio account'}
          </Button>
        </div>
      </section>

    </div>
  )
}
