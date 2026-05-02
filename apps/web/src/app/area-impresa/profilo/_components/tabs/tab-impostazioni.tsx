'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Trash2, AlertTriangle } from 'lucide-react'
import { Button, Input } from '@fixpro/ui'
import { authClient } from '@/lib/auth-client'

export function TabImpostazioni() {
  const router = useRouter()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)
    if (newPassword.length < 8) {
      setPwError('La nuova password deve essere di almeno 8 caratteri.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('Le password non coincidono.')
      return
    }
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

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
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
    <div className="space-y-6">
      <section className="surface-card space-y-5 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-4 w-4 stroke-primary" strokeWidth={1.9} />
          </div>
          <div>
            <p className="font-semibold text-secondary">Cambia password</p>
            <p className="text-xs text-muted-foreground">Scegli una password sicura di almeno 8 caratteri.</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary" htmlFor="current-pw">Password attuale</label>
            <Input
              id="current-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="rounded-2xl border-border bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary" htmlFor="new-pw">Nuova password</label>
            <Input
              id="new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="rounded-2xl border-border bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary" htmlFor="confirm-pw">Conferma nuova password</label>
            <Input
              id="confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="rounded-2xl border-border bg-white"
            />
          </div>

          {pwError && <p className="rounded-[18px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{pwError}</p>}
          {pwSuccess && <p className="rounded-[18px] border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">Password aggiornata con successo.</p>}

          <Button type="submit" disabled={pwLoading} className="primary-pill min-w-40">
            {pwLoading ? 'Salvataggio...' : 'Aggiorna password'}
          </Button>
        </form>
      </section>

      <section className="surface-card space-y-5 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="h-4 w-4 stroke-destructive" strokeWidth={1.9} />
          </div>
          <div>
            <p className="font-semibold text-secondary">Elimina account</p>
            <p className="text-xs text-muted-foreground">Questa azione è irreversibile. Tutti i dati verranno eliminati permanentemente.</p>
          </div>
        </div>

        <div className="max-w-md space-y-4 rounded-[22px] border border-destructive/20 bg-destructive/5 p-5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 stroke-destructive" strokeWidth={1.9} />
            <p className="text-sm text-destructive">
              Verranno eliminati il tuo account, il profilo impresa, le categorie, i crediti e tutta la cronologia delle richieste. L&apos;azione non può essere annullata.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary" htmlFor="delete-confirm">
              Digita <span className="font-mono font-bold">{DELETE_KEYWORD}</span> per confermare
            </label>
            <Input
              id="delete-confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={DELETE_KEYWORD}
              className="rounded-2xl border-border bg-white font-mono"
            />
          </div>

          {deleteError && <p className="rounded-[18px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{deleteError}</p>}

          <Button
            type="button"
            variant="destructive"
            disabled={deleteConfirm !== DELETE_KEYWORD || deleteLoading}
            onClick={handleDeleteAccount}
            className="rounded-full"
          >
            {deleteLoading ? 'Eliminazione...' : 'Elimina il mio account'}
          </Button>
        </div>
      </section>
    </div>
  )
}
