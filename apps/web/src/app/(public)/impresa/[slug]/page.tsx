import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@fixpro/db'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Images,
  MapPin,
  Sparkles,
  Star,
} from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { Badge, Card, CardContent, buttonVariants, cn } from '@fixpro/ui'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  try {
    const company = await api.showcase.public.getProfile({ slug })

    return {
      title: `${company.ragioneSociale} | FixPro`,
      description: company.description
        ? `${company.description.slice(0, 150)}...`
        : `Profilo professionale di ${company.ragioneSociale} su FixPro. Richiedi un preventivo gratuito.`,
    }
  } catch {
    return {}
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            'h-3.5 w-3.5',
            n <= Math.round(rating)
              ? 'fill-warning stroke-none'
              : 'fill-none stroke-muted-foreground',
          )}
        />
      ))}
    </span>
  )
}

type PublicService = {
  id: string
  nome: string
  slug: string
  categoria: {
    id: string
    nome: string
    slug: string
    settore: {
      id: string
      nome: string
      slug: string
    }
  }
}

function lowerFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1)
}

function buildHeroLine(services: PublicService[], categories: string[]) {
  if (services.length >= 2) {
    const firstService = services[0]
    const secondService = services[1]
    if (firstService && secondService) {
      return `Specializzati in ${lowerFirst(firstService.nome)} e ${lowerFirst(secondService.nome)}.`
    }
  }

  if (services.length === 1) {
    const firstService = services[0]
    if (firstService) {
      return `Specializzati in ${lowerFirst(firstService.nome)}.`
    }
  }

  if (categories.length >= 2) {
    const firstCategory = categories[0]
    const secondCategory = categories[1]
    if (firstCategory && secondCategory) {
      return `Competenze attive in ${lowerFirst(firstCategory)} e ${lowerFirst(secondCategory)}.`
    }
  }

  if (categories.length === 1) {
    const firstCategory = categories[0]
    if (firstCategory) {
      return `Competenze attive in ${lowerFirst(firstCategory)}.`
    }
  }

  return 'Interventi professionali per casa, impianti e lavori su misura.'
}

function buildMatchBullet(serviceName: string) {
  const lower = serviceName.toLowerCase()

  if (lower.includes('ristrutturazione appartamento')) return 'Vuoi ristrutturare casa'
  if (lower.includes('ristrutturazione bagno') || lower.includes('rifacimento bagno')) return 'Vuoi rifare il bagno'
  if (lower.includes('ristrutturazione cucina') || lower.includes('rifacimento cucina')) return 'Vuoi rifare la cucina'
  if (lower.includes('demolizioni')) return 'Devi iniziare lavori con demolizioni e rimozioni'
  if (lower.includes('sostituzione rubinetto')) return 'Devi sostituire un rubinetto'
  if (lower.includes('riparazione perdita')) return 'Hai una perdita da risolvere'
  if (lower.includes('installazione sanitari')) return 'Devi installare nuovi sanitari'

  return `Ti serve ${lowerFirst(serviceName)}`
}

export default async function ImpresaProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let company: Awaited<ReturnType<typeof api.showcase.public.getProfile>>
  try {
    company = await api.showcase.public.getProfile({ slug })
  } catch {
    notFound()
  }

  const companyWithServices = await prisma.company.findUnique({
    where: { id: company.id },
    select: {
      services: {
        select: {
          servizio: {
            select: {
              id: true,
              nome: true,
              slug: true,
              categoria: {
                select: {
                  id: true,
                  nome: true,
                  slug: true,
                  settore: {
                    select: {
                      id: true,
                      nome: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      portfolioImages: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          url: true,
          caption: true,
        },
      },
    },
  })

  const services = (companyWithServices?.services ?? [])
    .map((entry) => entry.servizio)
    .sort((a, b) => {
      const settoreCompare = a.categoria.settore.nome.localeCompare(b.categoria.settore.nome, 'it')
      if (settoreCompare !== 0) return settoreCompare

      const categoriaCompare = a.categoria.nome.localeCompare(b.categoria.nome, 'it')
      if (categoriaCompare !== 0) return categoriaCompare

      return a.nome.localeCompare(b.nome, 'it')
    })

  const portfolioImages = companyWithServices?.portfolioImages ?? []

  const joinedYear = new Date(company.createdAt).getFullYear()
  const isShowcase = company.hasActiveShowcase
  const tier = company.showcase?.plan?.tier
  const featuredServices = services.slice(0, 2)
  const matchBullets = services.slice(0, 3).map((service) => buildMatchBullet(service.nome))
  const visibleServices = services.slice(0, 8)

  const groupedServices = Array.from(
    visibleServices.reduce((map, service) => {
      const key = service.categoria.id
      const current = map.get(key)

      if (current) {
        current.services.push(service)
        return map
      }

      map.set(key, {
        categoria: service.categoria,
        services: [service],
      })
      return map
    }, new Map<string, { categoria: PublicService['categoria']; services: PublicService[] }>())
      .values(),
  )

  const categoryNames = company.categories.map((entry) => entry.categoria.nome)
  const heroLine = buildHeroLine(featuredServices, categoryNames)

  const settoriMap = new Map<string, { nome: string; categorie: { nome: string; slug: string }[] }>()
  for (const categoryLink of company.categories) {
    const settoreName = categoryLink.categoria.settore.nome
    if (!settoriMap.has(settoreName)) {
      settoriMap.set(settoreName, { nome: settoreName, categorie: [] })
    }

    settoriMap.get(settoreName)?.categorie.push({
      nome: categoryLink.categoria.nome,
      slug: categoryLink.categoria.slug,
    })
  }

  const settoriList = Array.from(settoriMap.values())
  const primaCategoriaSlug = company.categories[0]?.categoria.slug ?? null
  const contactHref = `/richiesta?ref=showcase&slug=${company.slug}${primaCategoriaSlug ? `&categoria=${primaCategoriaSlug}` : ''}`

  return (
    <div className="page-section bg-background">
      <div className="page-container space-y-10">
        {company.coverImageUrl && (
          <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-muted md:h-64">
            <Image
              src={company.coverImageUrl}
              alt={`${company.ragioneSociale} cover`}
              fill
              priority
              sizes="(min-width: 1024px) 1240px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">{company.ragioneSociale}</span>
        </nav>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-4">
                <div className="flex items-start gap-4">
                  {company.logoUrl && (
                    <div className="relative hidden h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:block">
                      <Image
                        src={company.logoUrl}
                        alt={`${company.ragioneSociale} logo`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-start gap-2">
                      <h1 className="section-title flex-1 text-secondary">
                        {company.ragioneSociale}
                      </h1>

                      {company.verified && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
                          <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
                          Verificata
                        </span>
                      )}

                      {isShowcase && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                          {tier === 'PRO' ? 'Vetrina Pro' : tier === 'PLUS' ? 'Vetrina Plus' : 'Vetrina Premium'}
                        </span>
                      )}
                    </div>

                    <p className="max-w-2xl text-base font-medium text-foreground/90 md:text-lg">
                      {heroLine}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {(company.city || company.province) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                          <span>{[company.city, company.province].filter(Boolean).join(', ')}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                        <span>Su FixPro dal {joinedYear}</span>
                      </div>

                      {company.avgRating !== null && (
                        <div className="flex items-center gap-1.5">
                          <StarRating rating={company.avgRating} />
                          <span>{company.avgRating.toFixed(1)} ({company.reviewCount} recensioni)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-sm shrink-0 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Contatto diretto</p>
                  <p className="text-sm text-muted-foreground">
                    Racconta il lavoro da fare e invia subito una richiesta a {company.ragioneSociale}.
                  </p>
                  {company.phone && (
                    <div className="rounded-xl border border-border bg-background/80 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Telefono aziendale
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">{company.phone}</p>
                    </div>
                  )}
                  <Link
                    href={contactHref}
                    className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
                  >
                    Contatta ora
                    <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2} />
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {matchBullets.length > 0 && (
              <Card>
                <CardContent className="space-y-4 p-5">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">È quello che stai cercando?</p>
                    <p className="text-sm text-muted-foreground">
                      Questi sono alcuni dei lavori che {company.ragioneSociale} gestisce oggi su FixPro.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {matchBullets.map((bullet) => (
                      <div
                        key={bullet}
                        className="flex items-start gap-2 rounded-xl border border-border bg-card p-3"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 stroke-primary" strokeWidth={2} />
                        <p className="text-sm text-foreground">{bullet}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Di cosa ci occupiamo</p>
                  <p className="text-sm text-muted-foreground">
                    Una selezione dei servizi che l&apos;impresa ha dichiarato nel proprio profilo.
                  </p>
                </div>

                {groupedServices.length > 0 ? (
                  <div className="space-y-4">
                    {groupedServices.map(({ categoria, services: categoryServices }) => (
                      <div key={categoria.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {categoria.nome}
                          </p>
                          <Link href={`/${categoria.slug}`}>
                            <Badge variant="outline" className="text-[11px]">
                              Vedi categoria
                            </Badge>
                          </Link>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {categoryServices.map((service) => (
                            <Badge key={service.id} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                              {service.nome}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    L&apos;impresa sta completando il dettaglio dei servizi offerti. Intanto puoi consultare le competenze professionali qui sotto.
                  </p>
                )}
              </CardContent>
            </Card>

            {company.description && (
              <Card>
                <CardContent className="space-y-2 p-5">
                  <p className="text-sm font-medium text-foreground">Chi siamo</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {company.description}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Come lavoriamo</p>
                  <p className="text-sm text-muted-foreground">
                    Un contatto rapido e chiaro, senza introdurre nuove opzioni o entità nel profilo.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    'Chiavi in mano',
                    'Preventivo gratuito',
                    'Risposta veloce',
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-border bg-card p-3 text-sm font-medium text-foreground"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {isShowcase && company.descriptionExtended && (
              <Card>
                <CardContent className="space-y-2 p-5">
                  <p className="text-sm font-medium text-foreground">La nostra storia</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {company.descriptionExtended}
                  </p>
                </CardContent>
              </Card>
            )}

            {isShowcase && portfolioImages.length > 0 && (
              <Card>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-2">
                    <Images className="h-4 w-4 shrink-0 stroke-muted-foreground" strokeWidth={1.9} />
                    <p className="text-sm font-medium text-foreground">Lavori realizzati</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {portfolioImages.map((image, index) => (
                      <div
                        key={image.id}
                        className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                      >
                        <Image
                          src={image.url}
                          alt={`Lavoro ${index + 1} di ${company.ragioneSociale}`}
                          fill
                          sizes="(min-width: 640px) 33vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {company.reviews.length > 0 && (
              <Card>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      Recensioni ({company.reviewCount})
                    </p>
                    {company.avgRating !== null && (
                      <div className="flex items-center gap-1.5">
                        <StarRating rating={company.avgRating} />
                        <span className="text-sm font-semibold text-foreground">
                          {company.avgRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {company.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="space-y-1.5 border-b border-border pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <StarRating rating={review.rating} />
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        {review.body && (
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {review.body}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="space-y-4 p-5">
                <p className="font-semibold text-foreground">Parla direttamente con l&apos;impresa</p>
                <p className="text-sm text-muted-foreground">
                  Spiega il lavoro che devi fare e invia una richiesta senza impegno.
                </p>
                {company.phone && (
                  <div className="rounded-xl border border-border bg-background/80 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Telefono aziendale
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">{company.phone}</p>
                  </div>
                )}
                <Link
                  href={contactHref}
                  className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
                >
                  Contatta ora
                  <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2} />
                </Link>
              </CardContent>
            </Card>

            {isShowcase && (
              <Card className="border-primary/20">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 shrink-0 stroke-primary" strokeWidth={1.9} />
                    <p className="text-sm font-medium text-foreground">
                      {tier === 'PRO' ? 'Vetrina Pro' : tier === 'PLUS' ? 'Vetrina Plus' : 'Vetrina Premium'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Profilo verificato e in evidenza su FixPro. Maggiore visibilità e credibilità.
                  </p>
                </CardContent>
              </Card>
            )}

            {company.verified && (
              <Card>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-5 w-5 shrink-0 stroke-success" strokeWidth={1.9} />
                    <p className="text-sm font-medium text-foreground">Impresa verificata</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    FixPro ha verificato i dati di questa impresa. Puoi richiedere un preventivo in tutta sicurezza.
                  </p>
                </CardContent>
              </Card>
            )}

            {settoriList.length > 0 && (
              <Card>
                <CardContent className="space-y-4 p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Competenze
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Le categorie restano un riferimento utile, ma secondario rispetto ai servizi mostrati sopra.
                    </p>
                  </div>

                  {settoriList.map((settore) => (
                    <div key={settore.nome} className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {settore.nome}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {settore.categorie.map((categoria) => (
                          <Link key={categoria.slug} href={`/${categoria.slug}`}>
                            <Badge variant="outline" className="cursor-pointer text-xs">
                              {categoria.nome}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}