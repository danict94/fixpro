'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'
import { PackageForm } from './package-form'

interface Pkg {
  id:          string
  name:        string
  credits:     number
  priceCents:  number
  validityMonths: number
  description: string | null
  popular:     boolean
  active:      boolean
  sortOrder:   number
}

export function PackageRowActions({ pkg }: { pkg: Pkg }) {
  const router        = useRouter()
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const toggleActive = trpc.admin.packages.toggleActive.useMutation({
    onSuccess: () => router.refresh(),
  })

  const del = trpc.admin.packages.delete.useMutation({
    onSuccess: () => router.refresh(),
  })

  if (editing) {
    return (
      <div className="col-span-full border-t bg-muted/30 p-4">
        <PackageForm pkg={pkg} onDone={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setEditing(true)}
        title="Modifica"
      >
        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleActive.mutate({ id: pkg.id })}
        disabled={toggleActive.isPending}
        title={pkg.active ? 'Disattiva' : 'Attiva'}
      >
        {pkg.active
          ? <EyeOff className="h-3.5 w-3.5" strokeWidth={2} />
          : <Eye className="h-3.5 w-3.5" strokeWidth={2} />
        }
      </Button>
      {confirm ? (
        <div className="flex items-center gap-1">
          <span className="text-xs text-destructive">Sicuro?</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => del.mutate({ id: pkg.id })}
            disabled={del.isPending}
            className="text-destructive hover:text-destructive"
          >
            Sì
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>
            No
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirm(true)}
          title="Elimina"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
        </Button>
      )}
    </div>
  )
}
