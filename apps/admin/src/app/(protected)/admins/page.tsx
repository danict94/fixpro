'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, Check, Mail, Shield, UserCheck } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { Button, Card, CardContent } from '@fixpro/ui'
import { AdminsTable, type AdminData } from './_components/admins-table'
import { ConfirmDialog } from './_components/confirm-dialog'
import { InviteModal } from './_components/invite-modal'

type Toast = { type: 'success' | 'error'; message: string } | null

export default function AdminsPage() {
  const [toast, setToast] = useState<Toast>(null)
  const [openInvite, setOpenInvite] = useState(false)
  const [pendingRevoke, setPendingRevoke] = useState<AdminData | null>(null)
  const [actionPending, setActionPending] = useState<Record<string, string>>({})

  const listAdmins = trpc.adminUsers.list.useQuery()
  const inviteMutation = trpc.adminUsers.invite.useMutation()
  const revokeMutation = trpc.adminUsers.revoke.useMutation()
  const changeRoleMutation = trpc.adminUsers.changeRole.useMutation()
  const forceResetMutation = trpc.adminUsers.forceResetPassword.useMutation()

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  const showToast = (message: string, type: 'success' | 'error') => setToast({ type, message })

  const withPending = useCallback(async (adminId: string, action: string, fn: () => Promise<void>) => {
    setActionPending((prev) => ({ ...prev, [adminId]: action }))
    try {
      await fn()
    } finally {
      setActionPending((prev) => {
        const next = { ...prev }
        delete next[adminId]
        return next
      })
    }
  }, [])

  const handleInvite = async (email: string, adminRole: 'SUPER_ADMIN' | 'ADMIN') => {
    try {
      const result = await inviteMutation.mutateAsync({ email, adminRole })

      const messageByStatus = {
        invited_new_user: `Invito inviato. ${email} riceverà un'email per impostare l'accesso.`,
        invited_existing_user: `Permessi aggiornati. ${email} riceverà un'email per accedere al pannello.`,
        access_link_resent: `Accesso inviato di nuovo. ${email} riceverà un nuovo link via email.`,
      } as const

      showToast(messageByStatus[result.status], 'success')
      setOpenInvite(false)
      listAdmins.refetch()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Errore durante l'invio dell'accesso", 'error')
    }
  }

  const handleForceReset = (admin: AdminData) =>
    withPending(admin.id, 'reset', async () => {
      try {
        await forceResetMutation.mutateAsync({ email: admin.email })
        showToast(
          `Reimposta accesso inviata. ${admin.email} riceverà un'email per impostare una nuova password.`,
          'success',
        )
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Errore durante l'invio dell'accesso", 'error')
      }
    })

  const handleChangeRole = (admin: AdminData, newRole: 'SUPER_ADMIN' | 'ADMIN') =>
    withPending(admin.id, 'role', async () => {
      try {
        await changeRoleMutation.mutateAsync({ userId: admin.id, newRole })
        showToast(
          `Ruolo di ${admin.email} aggiornato a ${newRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}`,
          'success',
        )
        listAdmins.refetch()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Errore cambiando ruolo', 'error')
      }
    })

  const handleRevokeConfirm = async () => {
    if (!pendingRevoke) return
    const admin = pendingRevoke
    setPendingRevoke(null)
    await withPending(admin.id, 'revoke', async () => {
      try {
        await revokeMutation.mutateAsync({ userId: admin.id })
        showToast(`Accesso di ${admin.email} revocato`, 'success')
        listAdmins.refetch()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Errore revocando admin', 'error')
      }
    })
  }

  const admins = ((listAdmins.data ?? []) as Omit<AdminData, 'accessStatus'>[]).map((admin) => ({
    ...admin,
    accessStatus: admin.lastLoginAt ? ('ACTIVE' as const) : ('INVITED' as const),
  }))

  const totalAdmins = admins.length
  const activeAdmins = admins.filter((admin) => admin.accessStatus === 'ACTIVE').length
  const invitedAdmins = totalAdmins - activeAdmins

  const kpis = [
    { label: 'Totale admin', value: totalAdmins, icon: Shield },
    { label: 'Attivi', value: activeAdmins, icon: UserCheck },
    { label: 'Invitati', value: invitedAdmins, icon: Mail },
  ] as const

  return (
    <div className="page-section space-y-6 lg:space-y-8">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-[22px] border px-4 py-4 shadow-lg ${
            toast.type === 'success'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-danger/30 bg-danger/10 text-danger'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <span className="text-sm font-medium leading-6">{toast.message}</span>
        </div>
      )}

      <section className="surface-section px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[720px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Gestione accessi
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-secondary">
              Amministratori
            </h1>
            <p className="muted-copy mt-2 text-sm leading-6">
              Gestisci inviti, ruoli e revoche del team amministrativo mantenendo separate le azioni
              più sensibili.
            </p>
          </div>

          <Button onClick={() => setOpenInvite(true)} className="primary-pill px-5 py-2.5">
            Invita admin
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="surface-card border-0 shadow-none">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold text-secondary">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <AdminsTable
        admins={admins}
        isPending={listAdmins.isPending}
        actionPending={actionPending}
        onForceReset={handleForceReset}
        onChangeRole={handleChangeRole}
        onRevoke={(admin) => setPendingRevoke(admin)}
      />

      <InviteModal
        open={openInvite}
        isPending={inviteMutation.isPending}
        onClose={() => setOpenInvite(false)}
        onInvite={handleInvite}
      />

      <ConfirmDialog
        open={pendingRevoke !== null}
        title="Revocare accesso admin?"
        description={`Stai per revocare l'accesso di ${pendingRevoke?.email ?? ''}. L'utente verrà disconnesso immediatamente e non potrà più accedere.`}
        confirmLabel="Revoca accesso"
        isPending={revokeMutation.isPending}
        onConfirm={handleRevokeConfirm}
        onCancel={() => setPendingRevoke(null)}
      />
    </div>
  )
}
