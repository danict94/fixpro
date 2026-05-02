'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardContent } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

interface Props {
  companyId:        string
  currentStatus:    string
  currentVerified:  boolean
  currentAdminNote: string
}

export function ImpresaActions({
  companyId,
  currentStatus,
  currentVerified,
  currentAdminNote,
}: Props) {
  const router = useRouter()
  const [grantMode,      setGrantMode]      = useState(false)
  const [suspendMode,    setSuspendMode]    = useState(false)
  const [amount,         setAmount]         = useState(10)
  const [grantNote,      setGrantNote]      = useState('')
  const [suspendReason,  setSuspendReason]  = useState('')
  const [adminNote,      setAdminNote]      = useState(currentAdminNote)
  const [noteSaved,      setNoteSaved]      = useState(false)

  const utils = trpc.useUtils()

  function invalidate() {
    utils.admin.companies.get.invalidate({ id: companyId })
    router.refresh()
  }

  const updateStatus = trpc.admin.companies.updateStatus.useMutation({
    onSuccess: () => { invalidate(); setSuspendMode(false); setSuspendReason('') },
  })

  const setVerified = trpc.admin.companies.setVerified.useMutation({
    onSuccess: invalidate,
  })

  const saveNote = trpc.admin.companies.saveNote.useMutation({
    onSuccess: () => { invalidate(); setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000) },
  })

  const grantCredits = trpc.admin.companies.grantCredits.useMutation({
    onSuccess: () => { invalidate(); setGrantMode(false); setAmount(10); setGrantNote('') },
  })

  function handleStatus(status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING', reason?: string) {
    updateStatus.mutate({ id: companyId, status, suspendedReason: reason })
  }

  function handleGrant(e: React.FormEvent) {
    e.preventDefault()
    grantCredits.mutate({ companyId, amount, note: grantNote })
  }

  function handleSuspend(e: React.FormEvent) {
    e.preventDefault()
    handleStatus('SUSPENDED', suspendReason || undefined)
  }

  function handleSaveNote(e: React.FormEvent) {
    e.preventDefault()
    saveNote.mutate({ id: companyId, adminNote })
  }

  return (
    <div className="space-y-4">

      {/* ── Stato account ──────────────────────────────────── */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <p className="font-semibold text-foreground">Stato account</p>

          {!suspendMode ? (
            <div className="flex flex-wrap gap-2">
              {currentStatus !== 'APPROVED' && (
                <Button
                  size="sm"
                  onClick={() => handleStatus('APPROVED')}
                  disabled={updateStatus.isPending}
                >
                  Approva
                </Button>
              )}
              {currentStatus !== 'REJECTED' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleStatus('REJECTED')}
                  disabled={updateStatus.isPending}
                >
                  Rifiuta
                </Button>
              )}
              {currentStatus === 'APPROVED' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSuspendMode(true)}
                  disabled={updateStatus.isPending}
                >
                  Sospendi
                </Button>
              )}
              {currentStatus === 'SUSPENDED' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatus('APPROVED')}
                  disabled={updateStatus.isPending}
                >
                  Riattiva
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSuspend} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="suspendReason">
                  Motivo sospensione (visibile all&apos;impresa)
                </label>
                <textarea
                  id="suspendReason"
                  rows={2}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Es. Troppi rescue non giustificati, comportamento anomalo…"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
              {updateStatus.error && (
                <p className="text-sm text-destructive">{updateStatus.error.message}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="destructive" disabled={updateStatus.isPending}>
                  {updateStatus.isPending ? 'Salvataggio…' : 'Conferma sospensione'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setSuspendMode(false)}>
                  Annulla
                </Button>
              </div>
            </form>
          )}

          {!suspendMode && updateStatus.error && (
            <p className="text-sm text-destructive">{updateStatus.error.message}</p>
          )}
        </CardContent>
      </Card>

      {/* ── Verifica impresa ───────────────────────────────── */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <p className="font-semibold text-foreground">Verifica manuale</p>
          <p className="text-xs text-muted-foreground">
            {currentVerified
              ? 'Questa impresa è segnata come verificata.'
              : 'Questa impresa non è ancora verificata manualmente.'}
          </p>
          <Button
            size="sm"
            variant={currentVerified ? 'outline' : 'default'}
            onClick={() => setVerified.mutate({ id: companyId, verified: !currentVerified })}
            disabled={setVerified.isPending}
          >
            {setVerified.isPending
              ? 'Salvataggio…'
              : currentVerified
                ? 'Rimuovi verifica'
                : 'Segna come verificata'}
          </Button>
          {setVerified.error && (
            <p className="text-sm text-destructive">{setVerified.error.message}</p>
          )}
        </CardContent>
      </Card>

      {/* ── Assegna crediti bonus ─────────────────────────── */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <p className="font-semibold text-foreground">Assegna crediti bonus</p>
          {!grantMode ? (
            <Button size="sm" variant="outline" onClick={() => setGrantMode(true)}>
              Aggiungi crediti
            </Button>
          ) : (
            <form onSubmit={handleGrant} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="amount">
                  Quantità
                </label>
                <input
                  id="amount"
                  type="number"
                  min={1}
                  max={1000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="grantNote">
                  Nota (obbligatoria)
                </label>
                <input
                  id="grantNote"
                  type="text"
                  required
                  value={grantNote}
                  onChange={(e) => setGrantNote(e.target.value)}
                  placeholder="Es. Bonus benvenuto, compensazione disservizio…"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              {grantCredits.error && (
                <p className="text-sm text-destructive">{grantCredits.error.message}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={grantCredits.isPending}>
                  {grantCredits.isPending ? 'Salvataggio…' : 'Conferma'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setGrantMode(false)}>
                  Annulla
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ── Nota interna admin ────────────────────────────── */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <p className="font-semibold text-foreground">Nota interna</p>
          <p className="text-xs text-muted-foreground">Visibile solo allo staff admin.</p>
          <form onSubmit={handleSaveNote} className="space-y-2">
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Note interne: comportamento, segnalazioni, osservazioni…"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
            {saveNote.error && (
              <p className="text-sm text-destructive">{saveNote.error.message}</p>
            )}
            <Button type="submit" size="sm" variant="outline" disabled={saveNote.isPending}>
              {saveNote.isPending ? 'Salvataggio…' : noteSaved ? 'Salvata ✓' : 'Salva nota'}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  )
}
