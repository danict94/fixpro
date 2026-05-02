import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, BadgeCheck, ArrowRight, Wrench } from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { buttonVariants, Card, CardContent, Badge, cn } from '@fixpro/ui'

/* ── Tipo Impresa ───────────────────────────────────────────── */
type Impresa = {
  id: string
  slug: string
  ragioneSociale: string
  description: string | null
  city: string | null
  province: string | null
  verified: boolean
  categories: { categoria: { nome: string; slug: string } }[]
}

/* ── Metadata dinamici ───────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; zona: string }>
}): Promise<Metadata> {
  const { slug, zona } = await params
  const result = await api.taxonomy.getBySlug({ slug })
  if (!result || result.type !== 'categoria') return {}

  const { categoria } = result
  const zonaLabel = zona.charAt(0).toUpperCase() + zona.slice(1).toLowerCase()

  return {
    title: `Trova ${categoria.nome} a ${zonaLabel} | FixPro`,
    description: `Preventivi gratuiti da ${categoria.nome} verificati a ${zonaLabel}. Richiesta semplice, risposta rapida.`,
  }
}

/* ── Componente impresa ─────────────────────────────────────── */
function ImpresaCard({ company }: { company: Impresa }) {
  return (
    <Link href={`/impresa/${company.slug}`} className="group block">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-foreground leading-snug">
              {company.ragioneSociale}
            </p>
            {company.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 stroke-success mt-0.5" strokeWidth={2} />
            )}
          </div>

          {company.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {company.description}
            </p>
          )}

          {(company.city || company.province) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
              <span>
                {[company.city, company.province].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {company.categories.slice(0, 3).map((cc) => (
              <Badge key={cc.categoria.slug} variant="secondary" className="text-xs">
                {cc.categoria.nome}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

/* ── Pagina ─────────────────────────────────────────────────── */
export default async function CategoriaZonaPage({
  params,
}: {
  params: Promise<{ slug: string; zona: string }>
}) {
  const { slug, zona } = await params
  const result = await api.taxonomy.getBySlug({ slug })

  if (!result || result.type !== 'categoria') notFound()

  const { categoria } = result
  const zonaLabel = zona.charAt(0).toUpperCase() + zona.slice(1).toLowerCase()

  /* 🔥 FIX DEFINITIVO */
  const imprese = (await api.taxonomy.getImpreseByCategoria({
    categoriaId: categoria.id,
    province: zona.toUpperCase(),
  })) as unknown as Impresa[]

  return (
    <div className="page-section bg-background">
      <div className="page-container space-y-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href={`/${categoria.settore.slug}`}>
            {categoria.settore.nome}
          </Link>
          <span>/</span>
          <Link href={`/${categoria.slug}`}>
            {categoria.nome}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{zonaLabel}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="section-title text-secondary">
              {categoria.nome} a {zonaLabel}
            </h1>
            <p className="body-lg mt-3 text-muted-foreground">
              {imprese.length} {imprese.length === 1 ? 'professionista verificato' : 'professionisti verificati'} disponibili a {zonaLabel}.
            </p>
          </div>

          <a
            href={`/richiesta?categoria=${categoria.slug}&zona=${zona}`}
            className={cn(buttonVariants(), 'shrink-0')}
          >
            Richiedi preventivo
          </a>
        </div>

        {/* Lista imprese */}
        {imprese.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {imprese.map((c: Impresa) => (
              <ImpresaCard key={c.id} company={c} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-12 text-center space-y-2">
            <Wrench className="mx-auto h-8 w-8 stroke-muted-foreground" strokeWidth={1.5} />
            <p className="font-medium text-muted-foreground">
              Nessun professionista disponibile a {zonaLabel}.
            </p>
          </div>
        )}

        {/* Link categoria */}
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/${categoria.slug}`} className="text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            Tutti i {categoria.nome}
          </Link>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-secondary">
            Hai bisogno di un {categoria.nome} a {zonaLabel}?
          </h2>
          <a
            href={`/richiesta?categoria=${categoria.slug}&zona=${zona}`}
            className={cn(buttonVariants({ size: 'lg' }))}
          >
            Richiedi preventivo
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>

      </div>
    </div>
  )
}