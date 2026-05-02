import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin,
  BadgeCheck,
  Star,
  Sparkles,
  Building2,
  ArrowRight,
} from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { Card, CardContent, Badge, cn } from '@fixpro/ui'

export const metadata = { title: 'Professionisti in evidenza' }

type FeaturedCompany = Awaited<ReturnType<typeof api.showcase.public.listFeatured>>[number]

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
              : 'stroke-muted-foreground fill-none',
          )}
        />
      ))}
    </span>
  )
}

function ProfessionistaCard({ company }: { company: FeaturedCompany }) {
  const tier = company.showcase?.plan?.tier

  return (
    <Link href={`/impresa/${company.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-shadow duration-150 hover:shadow-md">
        {/* Cover */}
        <div className="relative h-28 overflow-hidden bg-muted">
          {company.coverImageUrl ? (
            <Image
              src={company.coverImageUrl}
              alt={company.ragioneSociale}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5" />
          )}

          {tier && (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              <Sparkles className="h-2.5 w-2.5 fill-primary-foreground stroke-none" />
              {tier === 'PRO' ? 'Pro' : tier === 'PLUS' ? 'Plus' : 'Premium'}
            </span>
          )}
        </div>

        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            {company.logoUrl ? (
              <div className="relative -mt-10 h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-background bg-muted shadow-sm">
                <Image
                  src={company.logoUrl}
                  alt={company.ragioneSociale}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="relative -mt-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-background bg-muted shadow-sm">
                <Building2 className="h-6 w-6 stroke-muted-foreground" strokeWidth={1.5} />
              </div>
            )}

            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                  {company.ragioneSociale}
                </p>
                {company.verified && (
                  <BadgeCheck className="h-4 w-4 shrink-0 stroke-success" strokeWidth={2} />
                )}
              </div>

              {(company.city || company.province) && (
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.9} />
                  <span className="truncate">
                    {[company.city, company.province].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Descrizione breve */}
          {company.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {company.description}
            </p>
          )}

          {/* Rating */}
          {company.avgRating !== null && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <StarRating rating={company.avgRating} />
              <span className="font-medium text-foreground">
                {company.avgRating.toFixed(1)}
              </span>
              <span>({company.reviewCount} recensioni)</span>
            </div>
          )}

          {/* Categorie */}
          {company.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {company.categories.slice(0, 3).map((cc) => (
                <Badge
                  key={cc.categoria.slug}
                  variant="secondary"
                  className="px-1.5 py-0 text-[10px]"
                >
                  {cc.categoria.nome}
                </Badge>
              ))}
              {company.categories.length > 3 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  +{company.categories.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 text-xs font-medium text-primary transition-all group-hover:gap-2">
            Vedi profilo
            <ArrowRight className="h-3 w-3" strokeWidth={2} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function ProfessionistiPage() {
  let featured: FeaturedCompany[] = []

  try {
    featured = await api.showcase.public.listFeatured({ take: 24 })
  } catch {
    featured = []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Professionisti in evidenza
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Esplora professionisti verificati con profilo completo e recensioni reali.
          Puoi contattarli direttamente tramite FixPro.
        </p>
      </div>

      {featured.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Sparkles className="h-7 w-7 stroke-muted-foreground" strokeWidth={1.8} />
            </div>
            <p className="font-semibold text-foreground">
              Nessun professionista in evidenza
            </p>
            <p className="text-sm text-muted-foreground">
              I professionisti con Vetrina Premium compariranno qui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((company) => (
            <ProfessionistaCard key={company.id} company={company} />
          ))}
        </div>
      )}

      {/* Banner CTA richiesta */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-foreground">Non trovi quello che cerchi?</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Invia una richiesta e raggiungiamo tutti i professionisti della tua zona.
            </p>
          </div>
          <Link
            href="/area-cliente/richieste/nuova"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Invia richiesta
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}