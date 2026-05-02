import type { ReactNode } from 'react'
import { CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@fixpro/ui'

interface SuccessScreenProps {
  description: ReactNode
  notice?: string | null
  actions?: ReactNode
}

export function SuccessScreen({ description, notice, actions }: SuccessScreenProps) {
  return (
    <div className="mx-auto max-w-xl">
      <Card className="surface-card border-0 shadow-none">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-7 w-7 stroke-success" strokeWidth={1.9} />
          </div>
          <h2 className="text-xl font-semibold text-secondary">Richiesta inviata</h2>
          <div className="muted-copy text-sm leading-6">{description}</div>
          {notice && (
            <p className="rounded-[18px] border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
              {notice}
            </p>
          )}
          {actions}
        </CardContent>
      </Card>
    </div>
  )
}
