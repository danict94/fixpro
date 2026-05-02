import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { interventiBySlug } from '@/lib/taxonomy/interventi'

const preview = [
  'ristrutturazione-bagno',
  'rifacimento-impianto-elettrico',
  'riparazione-perdita-acqua',
]

export function DecisionLinksSection() {
  return (
    <section className="surface-section px-5 py-6 sm:px-6">
      
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">

        {/* LEFT */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">
            Guide e costi
          </p>

          <h3 className="mt-3 text-[22px] font-semibold text-secondary">
            Non sai quanto può costare il tuo lavoro?
          </h3>

          <p className="mt-3 text-sm text-muted-foreground">
            Consulta prezzi indicativi, esempi reali e cosa valutare prima di richiedere preventivi.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/interventi" className="btn-primary px-4 py-2">
              Tutte le guide
            </Link>

            <Link href="/area-cliente/richieste/nuova" className="secondary-link">
              Richiedi preventivo
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-3">
          {preview.map((slug) => {
            const i = interventiBySlug[slug]
            if (!i) return null

            return (
              <Link
                key={slug}
                href={`/interventi/${slug}`}
                className="flex items-center justify-between rounded-[18px] border border-border bg-card px-4 py-4 hover:shadow-soft transition"
              >
                <div>
                  <p className="text-sm font-semibold text-secondary">
                    Quanto costa {i.nome.toLowerCase()}?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Prezzi ed esempi reali
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            )
          })}
        </div>

      </div>
    </section>
  )
}