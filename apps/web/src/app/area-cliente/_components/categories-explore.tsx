import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { macroInterventoGroups } from '@/lib/taxonomy/interventi'

export function CategoriesExplore() {
  return (
    <section className="surface-section px-5 py-6 sm:px-6">

      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-secondary">
            Esplora categorie
          </h2>
          <p className="text-sm text-muted-foreground">
            Parti dal tipo di lavoro
          </p>
        </div>

        <Link href="/categorie" className="secondary-link">
          Vedi tutte
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {macroInterventoGroups.slice(0, 8).map((g) => (
          <Link
            key={g.slug}
            href={`/categorie/${g.slug}`}
            className="rounded-[18px] border border-border bg-card px-3 py-4 text-sm font-medium text-secondary text-center hover:shadow-soft transition"
          >
            {g.title}
          </Link>
        ))}
      </div>

    </section>
  )
}