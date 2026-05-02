'use client'

import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from '@fixpro/ui'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Conferma',
  isPending,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/25 p-4 backdrop-blur-[2px]">
      <Card className="surface-card w-full max-w-sm border-0 shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-secondary">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted-copy text-sm leading-6">{description}</p>
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="w-full rounded-full sm:w-auto"
          >
            Annulla
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            loading={isPending}
            className="w-full rounded-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
