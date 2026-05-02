import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { MapPin, BadgeCheck, ArrowRight, Wrench } from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { buttonVariants, Card, CardContent, Badge, cn } from '@fixpro/ui'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const result = await api.taxonomy.getBySlug({ slug })
  if (!result) return {}

  if (result.type === 'settore') {
    const { settore } = result
    return {
      title: `${settore.nome}: trova professionisti verificati | FixPro`,
      description: `Scopri le categorie di professionisti per ${settore.nome}. Richiedi preventivi gratuiti da artigiani verificati nella tua zona.`,
    }
  }

  if (result.type === 'categoria') {
    const { categoria } = result
    return {
      title: `Trova ${categoria.nome} nella tua zona | FixPro`,
      description: `Preventivi gratuiti da ${categoria.nome} verificati. Richiesta semplice, risposta rapida.`,
    }
  }

  if (result.type === 'intervento') {
    const { intervento } = result
    return {
      title: `${intervento.nome}: trova professionisti compatibili | FixPro`,
      description:
        intervento.descrizione ??
        `Descrivi ${intervento.nome.toLowerCase()} e trova categorie professionali compatibili su FixPro.`,
    }
  }

  return {}
}

function ImpresaCard({
  company,
}: {
  company: {
    slug: string
    ragioneSociale: string
    description: string | null
    city: string | null
    province: string | null
    verified: boolean
    categories: { categoria: { nome: string; slug: string } }[]
  }
}) {
  return (
    <Link href={`/impresa/${company.slug}`} className="group block">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="leading-snug font-semibold text-foreground">{company.ragioneSociale}</p>
            {company.verified && (
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 stroke-success" strokeWidth={2} />
            )}
          </div>
          {company.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{company.description}</p>
          )}
          {(company.city || company.province) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
              <span>{[company.city, company.province].filter(Boolean).join(', ')}</span>
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

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const result = await api.taxonomy.getBySlug({ slug })
  if (!result) notFound()

  if (result.type === 'settore') {
    const { settore } = result

    return (
      <div className="page-section bg-background">
        <div className="page-container space-y-10">
          <div className="max-w-2xl">
            <p className="eyebrow text-primary">Settore</p>
            <h1 className="section-title mt-2 text-secondary">{settore.nome}</h1>
            <p className="body-lg mt-4 text-muted-foreground">
              Trova professionisti verificati per tutti i lavori di {settore.nome.toLowerCase()}.
              Richiesta gratuita, risposte rapide.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {settore.categorie.map((cat: {
    id: string
    slug: string
    nome: string
    _count: {
      companies: number
    }
  }) => (
    <Link
      key={cat.id}
      href={`/${cat.slug}`}
      className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
    >
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{cat.nome}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {cat._count.companies}{' '}
          {cat._count.companies === 1
            ? 'professionista'
            : 'professionisti'} disponibili
        </p>
      </div>

      <ArrowRight
        className="h-4 w-4 shrink-0 stroke-muted-foreground transition-colors group-hover:stroke-primary"
        strokeWidth={1.9}
      />
    </Link>
  ))}
</div>
          <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <h2 className="text-xl font-bold text-secondary">Non trovi quello che cerchi?</h2>
            <p className="text-sm text-muted-foreground">
              Descrivi il lavoro e ti mettiamo in contatto con il professionista giusto.
            </p>
            <Link href="/richiesta" className={cn(buttonVariants({ size: 'lg' }))}>
              Richiedi preventivo gratuito
              <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (result.type === 'servizio') {
    redirect(`/richiesta?servizio=${result.servizio.slug}`)
  }

  if (result.type === 'intervento') {
    const { intervento } = result
    const categorieCompatibili = intervento.matchingCategorie
    const serviziRilevanti = intervento.matchingServizi

    return (
      <div className="page-section bg-background">
        <div className="page-container space-y-10">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <span className="font-medium text-foreground">{intervento.nome}</span>
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow text-primary">Intervento cliente</p>
              <h1 className="section-title mt-2 text-secondary">{intervento.nome}</h1>
              <p className="body-lg mt-3 text-muted-foreground">
                {intervento.descrizione ??
                  'FixPro usa questo intervento per individuare categorie professionali compatibili e guidarti verso la richiesta corretta.'}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <a
                href={`/richiesta?intervento=${intervento.slug}`}
                className={cn(buttonVariants(), 'shrink-0')}
              >
                Richiedi preventivo
              </a>
              {categorieCompatibili[0] && (
                <Link
                  href={`/${categorieCompatibili[0].categoria.slug}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Vedi una categoria compatibile
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-4 p-6">
                <h2 className="text-base font-semibold text-foreground">
                  Categorie professionali compatibili
                </h2>
                {categorieCompatibili.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {categorieCompatibili.map((match) => (
                      <Link key={match.categoria.id} href={`/${match.categoria.slug}`}>
                        <Badge
                          variant={match.isPrimary ? 'default' : 'secondary'}
                          className="cursor-pointer"
                        >
                          {match.categoria.nome}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nessuna categoria compatibile pubblica disponibile al momento.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-6">
                <h2 className="text-base font-semibold text-foreground">
                  Servizi correlati
                </h2>
                {serviziRilevanti.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {serviziRilevanti.map((match) => (
                      <Badge key={match.servizio.id} variant="secondary" className="text-xs">
                        {match.servizio.nome}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nessun servizio correlato pubblico disponibile al momento.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-base font-semibold text-foreground">Come funziona</h2>
              <p className="text-sm text-muted-foreground">
                Tu invii una sola richiesta. FixPro usa l&apos;intervento selezionato per
                individuare le categorie professionali compatibili e portarti verso il
                professionista più coerente con il lavoro da svolgere.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <h2 className="text-xl font-bold text-secondary">
              Hai bisogno di {intervento.nome.toLowerCase()}?
            </h2>
            <p className="text-sm text-muted-foreground">
              Invia una sola richiesta e lascia che FixPro individui le categorie professionali compatibili.
            </p>
            <a
              href={`/richiesta?intervento=${intervento.slug}`}
              className={cn(buttonVariants({ size: 'lg' }))}
            >
              Richiedi preventivo gratuito
              <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2} />
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (result.type !== 'categoria') notFound()

  const { categoria } = result
  const [imprese, province] = await Promise.all([
    api.taxonomy.getImpreseByCategoria({ categoriaId: categoria.id }),
    api.taxonomy.getProvinceByCategoria({ categoriaId: categoria.id }),
  ])

  return (
    <div className="page-section bg-background">
      <div className="page-container space-y-10">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href={`/${categoria.settore.slug}`} className="hover:text-foreground">
            {categoria.settore.nome}
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">{categoria.nome}</span>
        </nav>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="section-title text-secondary">
              Trova {categoria.nome} nella tua zona
            </h1>
            <p className="body-lg mt-3 text-muted-foreground">
              {categoria._count.companies} {categoria._count.companies === 1 ? 'professionista verificato' : 'professionisti verificati'} disponibili.
              Richiesta gratuita, preventivi in 48 ore.
            </p>
          </div>
          <a href={`/richiesta?categoria=${categoria.slug}`} className={cn(buttonVariants(), 'shrink-0')}>
            Richiedi preventivo
          </a>
        </div>

        {imprese.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {imprese.map((company) => (
              <ImpresaCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-dashed p-12 text-center">
            <Wrench className="mx-auto h-8 w-8 stroke-muted-foreground" strokeWidth={1.5} />
            <p className="font-medium text-muted-foreground">
              Nessun professionista ancora disponibile in questa categoria.
            </p>
            <p className="text-sm text-muted-foreground">
              Invia la tua richiesta: contatteremo i professionisti della tua zona.
            </p>
          </div>
        )}

        {province.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">
              {categoria.nome} per provincia
            </h2>
            <div className="flex flex-wrap gap-2">
              {province.map((provinceItem) => (
                <Link
                  key={provinceItem.province}
                  href={`/${categoria.slug}/${provinceItem.province.toLowerCase()}`}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  {provinceItem.city ?? provinceItem.province}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-xl font-bold text-secondary">
            Hai bisogno di un {categoria.nome}?
          </h2>
          <p className="text-sm text-muted-foreground">
            Invia la tua richiesta in 2 minuti. È gratuito per i clienti.
          </p>
          <a href={`/richiesta?categoria=${categoria.slug}`} className={cn(buttonVariants({ size: 'lg' }))}>
            Richiedi preventivo gratuito
            <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2} />
          </a>
        </div>
      </div>
    </div>
  )
}
