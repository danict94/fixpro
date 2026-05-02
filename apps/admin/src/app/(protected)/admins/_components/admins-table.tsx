'use client'

import { Shield } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@fixpro/ui'

export type AdminData = {
  id: string
  name: string
  email: string
  adminRole: 'SUPER_ADMIN' | 'ADMIN' | null
  invitedAt: Date
  lastLoginAt: Date | null
  accessStatus: 'ACTIVE' | 'INVITED'
}

interface Props {
  admins: AdminData[]
  isPending: boolean
  actionPending: Record<string, string>
  onForceReset: (admin: AdminData) => void
  onChangeRole: (admin: AdminData, role: 'SUPER_ADMIN' | 'ADMIN') => void
  onRevoke: (admin: AdminData) => void
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function AdminsTable({
  admins,
  isPending,
  actionPending,
  onForceReset,
  onChangeRole,
  onRevoke,
}: Props) {
  return (
    <Card className="surface-card border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-secondary">Team amministrativo</CardTitle>
        <CardDescription className="muted-copy">
          {isPending ? '...' : `${admins.length} account amministrativi nel sistema`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isPending ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 rounded-[20px] border border-border/70 bg-muted/20 px-5 py-4 lg:flex-row lg:items-center"
              >
                <Skeleton className="h-10 w-full max-w-xs" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-full max-w-[260px] lg:ml-auto" />
              </div>
            ))}
          </div>
        ) : admins.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Shield className="h-5 w-5" strokeWidth={1.9} />
            </div>
            <p className="mt-4 text-sm font-medium text-secondary">Nessun amministratore configurato</p>
            <p className="muted-copy mt-1 text-sm">
              Invia il primo accesso per iniziare a gestire il team admin.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[20px] ring-1 ring-border/60">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="px-5 py-4 font-medium">Admin</th>
                  <th className="px-4 py-4 font-medium">Ruolo</th>
                  <th className="px-4 py-4 font-medium">Stato</th>
                  <th className="px-4 py-4 font-medium">Ultimo accesso</th>
                  <th className="px-5 py-4 text-right font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {admins.map((admin) => {
                  const rowPending = actionPending[admin.id]
                  const isActive = admin.accessStatus === 'ACTIVE'

                  return (
                    <tr key={admin.id} className="transition-colors duration-150 hover:bg-muted/20">
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <div className="font-medium text-secondary">{admin.name || 'Admin'}</div>
                          <div className="text-sm text-muted-foreground">{admin.email}</div>
                          <div className="text-xs text-muted-foreground">
                            Invitato il {formatDate(admin.invitedAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <Badge
                          variant={
                            admin.adminRole === 'SUPER_ADMIN' ? 'destructive' : 'secondary'
                          }
                          className="rounded-full"
                        >
                          {admin.adminRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <Badge
                          variant={isActive ? 'success' : 'warning'}
                          className="rounded-full"
                        >
                          {isActive ? 'Attivo' : 'Invitato'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                        {isActive ? (
                          formatDate(admin.lastLoginAt!)
                        ) : (
                          <span className="italic">Accesso non ancora effettuato</span>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onForceReset(admin)}
                            loading={rowPending === 'reset'}
                            disabled={!!rowPending && rowPending !== 'reset'}
                            title={
                              isActive
                                ? "Invia un link per reimpostare l'accesso"
                                : "Invia un link per attivare l'accesso"
                            }
                            className="rounded-full"
                          >
                            {isActive ? 'Reimposta accesso' : 'Invia accesso'}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onChangeRole(
                                admin,
                                admin.adminRole === 'SUPER_ADMIN' ? 'ADMIN' : 'SUPER_ADMIN',
                              )
                            }
                            loading={rowPending === 'role'}
                            disabled={!!rowPending && rowPending !== 'role'}
                            className="rounded-full"
                          >
                            {admin.adminRole === 'SUPER_ADMIN'
                              ? 'Imposta Admin'
                              : 'Rendi Super Admin'}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRevoke(admin)}
                            loading={rowPending === 'revoke'}
                            disabled={!!rowPending && rowPending !== 'revoke'}
                            className="rounded-full text-danger hover:bg-danger/10 hover:text-danger"
                          >
                            Revoca accesso
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
