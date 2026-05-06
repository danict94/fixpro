import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MapPin, Star } from 'lucide-react'
import { prisma } from '@fixpro/db'
import { buildActivePublicShowcaseCompanyWhere } from '@fixpro/api/public-showcase-company'
import { SectionShell } from './section-shell'
import { SectionIntro } from './section-intro'

const FEATURED_LIMIT = 3
const FEATURED_POOL_SIZE = 12
const SHOWCASE_CTA_HREF = '/categorie'

/**
 * In sviluppo mostriamo un placeholder editoriale se l'impresa non ha ancora logo/cover,
 * così puoi lavorare sul design.
 *
 * In produzione la home resta più selettiva:
 * senza logoUrl o coverImageUrl l'impresa non entra nella sezione.
 */
const ALLOW_IMAGE_PLACEHOLDER = process.env.NODE_ENV !== 'production'
const REQUIRE_HOME_IMAGE = !ALLOW_IMAGE_PLACEHOLDER

async function getFeaturedProfessionals() {
  const companies = await prisma.company.findMany({
    where: {
      ...buildActivePublicShowcaseCompanyWhere(),
      ...(REQUIRE_HOME_IMAGE
        ? { OR: [{ coverImageUrl: { not: null } }, { logoUrl: { not: null } }] }
        : {}),
      categories: { some: {} },
      services: { some: {} },
    },
    select: {
      id: true,
      slug: true,
      ragioneSociale: true,
      logoUrl: true,
      coverImageUrl: true,
      city: true,
      province: true,
      updatedAt: true,
      categories: {
        take: 2,
        select: {
          categoria: {
            select: {
              nome: true,
            },
          },
        },
      },
      services: {
        take: 3,
        select: {
          servizio: {
            select: {
              nome: true,
            },
          },
        },
      },
      reviews: {
        where: { published: true },
        select: { rating: true },
      },
    },
    orderBy: [
      { showcase: { plan: { tier: 'desc' } } },
      { verified: 'desc' },
      { updatedAt: 'desc' },
    ],
    take: FEATURED_POOL_SIZE,
  })

  const selected: typeof companies = []
  const usedCities = new Set<string>()

  for (const company of companies) {
    const cityKey = `${company.city ?? 'unknown'}-${company.province ?? 'unknown'}`

    if (usedCities.has(cityKey)) continue

    selected.push(company)
    usedCities.add(cityKey)

    if (selected.length === FEATURED_LIMIT) break
  }

  if (selected.length >= FEATURED_LIMIT) {
    return selected
  }

  for (const company of companies) {
    if (selected.some((item) => item.id === company.id)) continue

    selected.push(company)

    if (selected.length === FEATURED_LIMIT) break
  }

  return selected
}

type FeaturedProfessional = Awaited<ReturnType<typeof getFeaturedProfessionals>>[number]

function getLocationLabel(company: FeaturedProfessional) {
  if (company.city && company.province) return `${company.city} (${company.province})`
  if (company.city) return company.city
  if (company.province) return company.province

  return 'Zona servita'
}

function getPrimaryCategory(company: FeaturedProfessional) {
  return company.categories[0]?.categoria.nome ?? 'Servizi per la casa'
}

function getImage(company: FeaturedProfessional) {
  return {
    src: company.coverImageUrl ?? company.logoUrl,
    isCover: Boolean(company.coverImageUrl),
  }
}

function getAverageRating(reviews: { rating: number }[]) {
  if (reviews.length === 0) return null

  const total = reviews.reduce((sum, review) => sum + review.rating, 0)

  return Math.round((total / reviews.length) * 10) / 10
}

function getCompanyInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function FeaturedProfessionalBlock({ company }: { company: FeaturedProfessional }) {
  const image = getImage(company)
  const location = getLocationLabel(company)
  const primaryCategory = getPrimaryCategory(company)
  const averageRating = getAverageRating(company.reviews)
  const services = company.services.map((item) => item.servizio.nome).slice(0, 2)
  const initials = getCompanyInitials(company.ragioneSociale)

  if (!image.src && !ALLOW_IMAGE_PLACEHOLDER) return null

  return (
    <article className="border-primary flex h-full gap-3.5 border-l-[3px] py-4 pl-3 lg:px-4">
      <Link
        href={`/impresa/${company.slug}`}
        className="bg-muted ring-border/70 relative h-20 w-20 shrink-0 overflow-hidden rounded-[18px] ring-1"
      >
        {image.src ? (
          <Image
            src={image.src}
            alt={company.ragioneSociale}
            fill
            className={image.isCover ? 'object-cover' : 'object-contain p-3'}
            sizes="80px"
          />
        ) : (
          <div className="from-primary/10 flex h-full w-full items-center justify-center bg-gradient-to-br via-white to-[#F6F7FB]">
            <span className="text-primary/80 text-[24px] font-semibold">
              {initials || 'FP'}
            </span>
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <span className="text-primary text-[11px] font-semibold tracking-[0.12em] uppercase">
          Vetrina in evidenza
        </span>

        <h3 className="text-secondary mt-1 text-[17px] leading-[1.15] font-semibold">
          {company.ragioneSociale}
        </h3>

        <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-[12px]">
          <MapPin className="text-primary h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span>{location}</span>
        </div>

        <p className="text-secondary mt-2 text-[13px] font-semibold">{primaryCategory}</p>

        {services.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {services.map((service) => (
              <span key={service} className="text-muted-foreground text-[12px] leading-5">
                {service}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-1.5 text-[12px] leading-5">
            Servizi in aggiornamento.
          </p>
        )}

        <div className="text-muted-foreground mt-2.5 flex flex-wrap items-center gap-2 text-[12px]">
          <div className="flex items-center gap-0.5 text-emerald-500" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((star) => (
              <Star key={star} className="h-3.5 w-3.5 fill-current stroke-current" />
            ))}
          </div>

          {averageRating !== null ? (
            <span>
              {averageRating}/5 · {company.reviews.length} recensioni
            </span>
          ) : (
            <span>Recensioni verificate in arrivo</span>
          )}
        </div>

        <Link
          href={`/impresa/${company.slug}`}
          className="text-primary mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold transition hover:text-primary/80"
        >
          Vedi profilo
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  )
}

export async function HomeFeaturedProfessionalsSection() {
  const companies = await getFeaturedProfessionals()

  if (companies.length === 0) {
    return null
  }

  return (
    <SectionShell tone="default" spacing="sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <SectionIntro
          eyebrow="Professionisti in evidenza"
          title="Vetrine attive su FixPro."
          description="Una selezione di professionisti con profilo pubblico, servizi visibili e presenza attiva sulla piattaforma."
        />

        <Link
          href={SHOWCASE_CTA_HREF}
          className="text-primary inline-flex w-fit items-center gap-2 text-[14px] font-semibold transition hover:text-primary/80"
        >
          Scopri le vetrine
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="border-border/70 mt-6 border-y">
        <div className="divide-border/70 grid gap-0 divide-y lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {companies.map((company) => (
            <FeaturedProfessionalBlock key={company.id} company={company} />
          ))}
        </div>
      </div>
    </SectionShell>
  )
}
