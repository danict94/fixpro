'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, Card, CardContent } from '@fixpro/ui'
import { PackageForm } from './package-form'

export function NewPackagePanel() {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-1.5 h-4 w-4" strokeWidth={2} />
        Nuovo pacchetto
      </Button>
    )
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="mb-4 font-semibold text-foreground">Nuovo pacchetto</h3>
        <PackageForm onDone={() => setOpen(false)} />
      </CardContent>
    </Card>
  )
}
