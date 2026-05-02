import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'
import { api } from '@/lib/trpc/server'
import { Card, CardContent } from '@fixpro/ui'
import { AcquistoClient } from './_components/acquisto-client'

export const metadata = { title: 'Acquisto Vetrina Premium' }

export default async function VetrinaAcquistoPage() {
  const [plans, status] = await Promise.all([
    api.showcase.company.listPlans(),
    api.showcase.company.getStatus(),
  ])

  const currentTier = status.isActive ? status.company.showcase?.plan.tier ?? null : null

  return (
    <div className="space-y-6">

      <Link
        href="/area-impresa/vetrina"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 stroke-muted-foreground" strokeWidth={1.8} />
        Torna alla Vetrina
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Scegli il piano Vetrina</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ogni piano aumenta la tua visibilità e ti offre tariffe agevolate sui contatti generati dalla vetrina.
          Gli sconti si applicano <strong>solo ai contatti provenienti dalla vetrina</strong>, non ai lead marketplace standard.
        </p>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Nessun piano disponibile al momento. Contatta il supporto per attivare la vetrina.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Suspense fallback={null}>
          <AcquistoClient plans={plans} currentTier={currentTier ?? null} />
        </Suspense>
      )}

      {/* Nota importante */}
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="p-5 space-y-1">
          <p className="text-sm font-medium text-foreground">Nota importante sugli sconti</p>
          <p className="text-sm text-muted-foreground">
            Le tariffe agevolate si applicano <strong>esclusivamente ai contatti generati dalla vetrina</strong>
            {' '}(es. dal profilo pubblico, dalla sezione in evidenza, dai blocchi promozionali).
            I lead del marketplace standard continuano ad avere il costo base invariato.
          </p>
        </CardContent>
      </Card>

    </div>
  )
}
