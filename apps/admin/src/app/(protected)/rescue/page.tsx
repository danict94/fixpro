import Link from 'next/link'
import { CreditCard, Zap } from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { Badge, Card, CardContent } from '@fixpro/ui'

export const metadata = { title: 'Rescue' }

const STATUS_CONFIG = {
  OPEN: { label: 'Aperto', variant: 'warning' },
  UNDER_REVIEW: { label: 'In revisione', variant: 'secondary' },
  APPROVED: { label: 'Approvato', variant: 'success' },
  REJECTED: { label: 'Rifiutato', variant: 'destructive' },
  CLOSED: { label: 'Chiuso', variant: 'secondary' },
} as const

type RescueStatus = keyof typeof STATUS_CONFIG

type AdminRescueListItem = {
  id: string
  status: RescueStatus
  reason: string
  createdAt: Date | string
  company: {
    ragioneSociale: string
  }
  request: {
    title: string
    city: string | null
    categoria: {
      nome: string
    }
    purchases: Array<{
      paymentMethod: string
      creditSpent: number | null
    }>
  }
}

const STATUS_TABS = [
  { label: 'Tutti', value: undefined },
  { label: 'Aperti', value: 'OPEN' },
  { label: 'In revisione', value: 'UNDER_REVIEW' },
  { label: 'Approvati', value: 'APPROVED' },
  { label: 'Rifiutati', value: 'REJECTED' },
] as const

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function RescuePage({ searchParams }: Props) {
  const { status } = await searchParams

  const validStatus = ['OPEN', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'].includes(
    status ?? '',
  )
    ? (status as RescueStatus)
    : undefined

  const rescues = (await api.admin.rescue.list({ status: validStatus })) as AdminRescueListItem[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rescue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rescues.length} richieste di rimborso crediti delle imprese.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const href = tab.value ? `/rescue?status=${tab.value}` : '/rescue'
          const isActive = validStatus === tab.value

          return (
            <Link
              key={tab.label}
              href={href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* List */}
      {rescues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nessun rescue trovato.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rescues.map((r: AdminRescueListItem) => {
            const cfg = STATUS_CONFIG[r.status]
            const purchase = r.request.purchases[0]
            const reasonPreview =
              r.reason.length > 90 ? `${r.reason.slice(0, 90)}…` : r.reason

            return (
              <Link key={r.id} href={`/rescue/${r.id}`}>
                <Card className="transition-shadow duration-150 hover:shadow-md">
                  <CardContent className="flex items-start gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {r.company.ragioneSociale}
                        </p>

                        <Badge variant={cfg.variant} className="text-xs">
                          {cfg.label}
                        </Badge>

                        {purchase && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {purchase.paymentMethod === 'CREDITS' ? (
                              <>
                                <Zap className="h-3 w-3 stroke-warning" strokeWidth={2} />
                                {purchase.creditSpent ?? 0} crediti
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-3 w-3 stroke-info" strokeWidth={2} />
                                One-time
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {r.request.title} · {r.request.categoria.nome}
                        {r.request.city && ` · ${r.request.city}`}
                        {' · '}
                        {new Date(r.createdAt).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>

                      <p className="text-xs italic text-muted-foreground">{reasonPreview}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}