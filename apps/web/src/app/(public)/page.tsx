import type { ComponentType } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  ShieldCheck,
  MapPin,
  Zap,
  Star,
  } from 'lucide-react'
import { SectionShell } from './_components/home/section-shell'
import { SectionIntro } from './_components/home/section-intro'
import { HomeKnowledgeSection } from './_components/home/home-knowledge-section'
import { HomeActivitySection } from './_components/home/home-activity-section'
import { HomeReviewsSection } from './_components/home/home-reviews-section'
import { interventiBySlug, macroInterventoGroups } from '@/lib/taxonomy/interventi'
import { PublicHeroSearch } from './_components/public-hero-search'


export const metadata: Metadata = {
  title: 'Trova professionisti per i lavori di casa | FixPro',
  description:
    'Trova il professionista giusto per i lavori di casa con una richiesta semplice e gratuita.',
}

type IconComponent = ComponentType<{
  className?: string
  strokeWidth?: number
}>

const decisionPreviewLinks = [
  'rifacimento-bagno',
  'tinteggiatura-casa',
  'perdita-acqua',
] as const

function HeroFeature({
  icon: Icon,
  title,
  text,
  tone = 'blue',
}: {
  icon: IconComponent
  title: string
  text: string
  tone?: 'blue' | 'green' | 'amber'
}) {
  const toneClasses = {
    blue: {
      iconWrap: 'bg-white/90 ring-sky-100',
      icon: 'text-[#5b45ff]',
    },
    green: {
      iconWrap: 'bg-white/90 ring-emerald-100',
      icon: 'text-emerald-500',
    },
    amber: {
      iconWrap: 'bg-white/90 ring-amber-100',
      icon: 'text-amber-500',
    },
  }[tone]

  return (
    <div className="text-center">
      <div
        className={`mx-auto flex h-[56px] w-[56px] items-center justify-center rounded-full shadow-[0_12px_30px_rgba(15,23,42,0.10)] ring-1 ${toneClasses.iconWrap}`}
      >
        <Icon className={`h-6 w-6 ${toneClasses.icon}`} strokeWidth={2.15} />
      </div>

      <h3 className="mx-auto mt-4 max-w-[135px] text-[14px] font-semibold leading-5 text-secondary">
        {title}
      </h3>

      <p className="mx-auto mt-1.5 max-w-[140px] text-[12px] leading-5 text-muted-foreground">
        {text}
      </p>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 hidden overflow-hidden lg:block">
  <div className="absolute inset-0 translate-x-[2%] scale-[1.04]">
    <Image
      src="/images/home/hero-real.webp"
      alt="Persona che usa FixPro per trovare un professionista per lavori di casa"
      fill
      priority
      quality={90}
      className="object-cover object-[45%_center]"
      sizes="100vw"
    />
  </div>

  <div
    className="absolute inset-0 bg-gradient-to-r from-background/82 via-background/18 to-transparent"
    aria-hidden="true"
  />

  <div
    className="absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-background/48 via-background/12 to-transparent"
    aria-hidden="true"
  />

  <div
    className="absolute inset-x-0 bottom-0 h-[14%] bg-gradient-to-t from-background/20 to-transparent"
    aria-hidden="true"
  />
</div>

      <div className="relative mx-auto max-w-[1240px]">
        <div className="grid lg:min-h-[700px] lg:grid-cols-[43%_57%]">
          <div className="relative z-20 flex items-center">
            <div className="w-full px-5 py-10 sm:px-7 sm:py-12 lg:px-8 lg:py-16 xl:px-9">
              <div className="w-full lg:max-w-[540px]">
                <h1 className="max-w-[560px] text-[42px] font-bold leading-[0.98] tracking-[-0.065em] text-secondary sm:text-[50px] lg:text-[56px] xl:text-[62px]">
                  Il professionista giusto, a portata di richiesta.
                </h1>

                <p className="mt-5 max-w-[500px] text-[16px] leading-[1.65] text-muted-foreground sm:text-[17px]">
                  Cerca, invia la richiesta e ricevi risposta dai professionisti
                  vicino a te.
                </p>

                <div className="mt-6 h-1 w-20 rounded-full bg-primary" />

                <div className="mt-9 lg:w-[118%]">
                  <p className="mb-3 text-[15px] font-semibold text-secondary">
                    Di cosa hai bisogno?
                  </p>

                  <PublicHeroSearch />

                  <div className="mt-3">
                    <Link
                      href="/categorie"
                      className="text-[13px] font-medium text-primary transition hover:text-primary/80"
                    >
                      Oppure esplora gli interventi più comuni
                    </Link>
                  </div>
                </div>

                <div className="mt-10 grid max-w-[510px] grid-cols-3 gap-8">
                  <HeroFeature
                    icon={ShieldCheck}
                    title="Professionisti verificati"
                    text="Solo esperti qualificati e affidabili."
                    tone="blue"
                  />

                  <HeroFeature
                    icon={MapPin}
                    title="Vicini a te"
                    text="Trova chi lavora nella tua zona."
                    tone="green"
                  />

                  <HeroFeature
                    icon={Zap}
                    title="Risposte rapide"
                    text="Meno attese, più soluzioni."
                    tone="amber"
                  />
                </div>

                <div className="mt-10 border-t border-border pt-6">
                  <div className="flex flex-wrap items-center gap-1.5 text-emerald-500">
                    <Star className="h-4 w-4 fill-current stroke-current" />
                    <Star className="h-4 w-4 fill-current stroke-current" />
                    <Star className="h-4 w-4 fill-current stroke-current" />
                    <Star className="h-4 w-4 fill-current stroke-current" />
                    <Star className="h-4 w-4 fill-current stroke-current" />

                    <span className="ml-2 text-[14px] font-semibold text-secondary">
                      4.8/5 da oltre 1.200 clienti
                    </span>
                  </div>

                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    Affidati a FixPro e trova il professionista giusto per te.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex min-h-[460px] items-center justify-center overflow-hidden lg:hidden">
            <Image
              src="/images/home/hero-real.webp"
              alt="Persona che usa FixPro per trovare un professionista per lavori di casa"
              fill
              priority
              quality={90}
              className="object-cover object-[58%_center]"
              sizes="100vw"
            />

            <div
              className="absolute inset-0 bg-gradient-to-t from-background/58 via-background/12 to-transparent"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function HowStep({
  number,
  imageSrc,
  title,
  text,
}: {
  number: string
  imageSrc: string
  title: string
  text: string
}) {
  return (
    <article className="relative z-10 text-center">
      <div className="relative mx-auto flex min-h-[190px] items-center justify-center">
        <div
          className="pointer-events-none absolute inset-x-8 top-8 h-28 rounded-full bg-primary/8 blur-3xl"
          aria-hidden="true"
        />

        <span className="absolute left-4 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm ring-4 ring-[#F6F7FB]">
          {number}
        </span>

        <Image
          src={imageSrc}
          alt=""
          width={360}
          height={260}
          className="relative z-10 h-auto w-full max-w-[260px] object-contain"
        />
      </div>

      <h3 className="mt-5 text-[17px] font-semibold leading-6 tracking-[-0.02em] text-secondary">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-[260px] text-[13px] leading-6 text-muted-foreground">
        {text}
      </p>
    </article>
  )
}

function HowItWorksSection() {
  return (
    <div id="come-funziona" className="scroll-mt-20">
      <SectionShell
        tone="default"
        spacing="xl"
        className="relative overflow-hidden"
      >
        <div
          className="pointer-events-none absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/7 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-emerald-400/7 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <SectionIntro
            eyebrow="Come funziona"
            title="Richiedi in pochi passi, risolvi senza stress."
            description="Descrivi il lavoro, ricevi risposte e scegli il professionista più adatto a te."
            align="center"
          />

        <div className="relative mt-14">
          <svg
            className="pointer-events-none absolute left-[18%] top-[54px] hidden h-[70px] w-[64%] text-primary/25 lg:block"
            viewBox="0 0 760 90"
            fill="none"
            aria-hidden="true"
            preserveAspectRatio="none"
          >
            <path
              d="M0 44 C95 12 160 12 250 44 C340 76 420 76 510 44 C600 12 670 16 760 42"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="6 13"
            />
          </svg>

          <div className="relative grid gap-12 sm:grid-cols-3 lg:gap-8">
            <HowStep
              number="1"
              imageSrc="/images/home/descrivi-richiesta.svg"
              title="Descrivi il lavoro"
              text="Racconta cosa ti serve, aggiungi dettagli, foto e posizione."
            />

            <HowStep
              number="2"
              imageSrc="/images/home/ricevi-risposte.svg"
              title="Ricevi risposte"
              text="I professionisti interessati valutano la richiesta e ti rispondono."
            />

            <HowStep
              number="3"
              imageSrc="/images/home/scegli-professionista.svg"
              title="Scegli con calma"
              text="Confronta chiarezza, disponibilità e profili prima di decidere."
            />
          </div>
        </div>

        <div className="mt-14 flex justify-center">
          <Link
            href="/richiesta"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            Richiedi preventivo gratuito
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      
        </SectionShell>
    </div>
  )
}

function MacroServiceCard({
  title,
  text,
  href,
  items,
  imageSrc,
}: {
  title: string
  text: string
  href: string
  items: string[]
  imageSrc?: string
}) {
  const visibleItems = items.slice(0, 3)
  const hiddenCount = Math.max(items.length - visibleItems.length, 0)
  const safeImageSrc = imageSrc?.trim()

  return (
    <Link href={href} className="group block h-full">
      <article className="relative h-full">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[34px] bg-[#F6F7FB] shadow-sm ring-1 ring-border/60">
          {safeImageSrc ? (
            <Image
              src={safeImageSrc}
              alt={title}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#F4F3FF] via-[#F6F7FB] to-white">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
              <div className="absolute bottom-8 left-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          <div className="absolute bottom-4 left-4 right-4">
            <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary shadow-sm backdrop-blur">
              Area lavori
            </span>
          </div>
        </div>

        <div className="pt-5">
          <h3 className="text-[22px] font-semibold leading-[1.08] tracking-[-0.035em] text-secondary">
            {title}
          </h3>

          <p className="mt-3 max-w-[360px] text-[14px] leading-6 text-muted-foreground">
            {text}
          </p>

          <div className="mt-4 space-y-2">
            {visibleItems.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-[13px] font-medium text-secondary"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{item}</span>
              </div>
            ))}

            {hiddenCount > 0 && (
              <p className="pt-1 text-[12px] font-medium text-muted-foreground">
                +{hiddenCount} altri interventi
              </p>
            )}
          </div>

          <div className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-primary">
            Vedi interventi
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </div>
        </div>
      </article>
    </Link>
  )
}


function PopularServicesSection() {
  const featuredGroups = [
    {
      icon: 'bath',
      title: 'Bagni e sanitari',
      imageSrc: '/images/home/service-areas/bagni-sanitari.webp',
    },
    {
      icon: 'house',
      title: 'Costruzioni e ristrutturazioni',
      imageSrc: '/images/home/service-areas/casa-ristrutturazioni.webp',
    },
    {
      icon: 'droplets',
      title: 'Impianti e riparazioni',
      imageSrc: '/images/home/service-areas/impianti-riparazioni.webp',
    },
  ] as const

  return (
    <SectionShell tone="muted" spacing="lg">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <SectionIntro
          eyebrow="I lavori più richiesti"
          title="Parti dalle esigenze più comuni."
          description="Bagni, ristrutturazioni e impianti sono tra le richieste più frequenti. Puoi partire da qui o cercare il servizio più adatto alla tua situazione."
        />

        <Link
          href="/categorie"
          className="inline-flex w-fit items-center gap-2 text-[14px] font-semibold text-primary transition hover:text-primary/80"
        >
          Vedi tutte le categorie
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-10 grid gap-x-7 gap-y-12 md:grid-cols-3">
        {featuredGroups.map((preview) => {
          const group = macroInterventoGroups.find(
            (item) => item.icon === preview.icon,
          )

          if (!group) {
            return null
          }

          return (
            <MacroServiceCard
              key={group.slug}
              title={preview.title}
              text={group.description}
              href={`/categorie/${group.slug}`}
              imageSrc={preview.imageSrc}
              items={group.interventoSlugs.flatMap((slug) => {
                const nome = interventiBySlug[slug]?.nome
                return nome ? [nome] : []
              })}
            />
          )
        })}
      </div>

      <div className="mt-10 border-t border-border/70 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[720px] text-[14px] leading-7 text-muted-foreground">
            Cerchi manutenzione, traslochi, progettazione tecnica o un
            intervento urgente? Esplora tutte le categorie e scegli il servizio
            più vicino alla tua richiesta.
          </p>

          <Link
            href="/categorie"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-secondary ring-1 ring-border/70 transition hover:bg-background"
          >
            Esplora tutto
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </SectionShell>
  )
}

function BusinessSection() {
  return (
    <section
      id="imprese"
      className="relative overflow-hidden bg-muted py-14 sm:py-16 lg:py-20 scroll-mt-20"
    >
      <div
        className="pointer-events-none absolute right-[-180px] top-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-14">
          <Link href="/registrati" className="group relative block">
            <div
              className="pointer-events-none absolute inset-8 rounded-full bg-primary/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative aspect-[5/4] w-full">
              <Image
                src="/images/home/professionisti-fixpro.webp"
                alt="Professionista FixPro che riceve richieste di lavoro"
                fill
                className="object-contain object-center transition duration-500 group-hover:scale-[1.025]"
                sizes="(min-width: 1024px) 620px, 100vw"
              />
            </div>
          </Link>

          <div className="relative lg:pl-4">
            <div className="mb-6 h-1 w-16 rounded-full bg-primary" />

            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">
              Per i professionisti
            </p>

            <h2 className="mt-3 max-w-[500px] text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] text-secondary sm:text-[38px]">
              Vuoi ricevere richieste più adatte al tuo lavoro?
            </h2>

            <p className="mt-4 max-w-[520px] text-[15px] leading-7 text-muted-foreground">
              Crea una presenza chiara su FixPro, mostra i servizi che offri e
              fatti trovare da clienti nella tua zona.
            </p>

            <div className="mt-7 space-y-4">
              <div className="border-l-[3px] border-sky-500 pl-4">
                <h3 className="text-[15px] font-semibold text-secondary">
                  Presenta la tua attività
                </h3>
                <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
                  Racconta chi sei, quali lavori segui e in quali zone lavori.
                </p>
              </div>

              <div className="border-l-[3px] border-emerald-500 pl-4">
                <h3 className="text-[15px] font-semibold text-secondary">
                  Ricevi richieste pertinenti
                </h3>
                <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
                  Valuta richieste compatibili con servizi, territorio e
                  disponibilità.
                </p>
              </div>
            </div>

            <Link
              href="/area-professionisti"
              className="mt-8 inline-flex items-center gap-2 text-[14px] font-semibold text-primary transition hover:text-primary/80"
            >
              Scopri come funziona l’area professionisti
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function DecisionLinksSection() {
  return (
    <section className="bg-background pb-16 pt-2 sm:pb-20 sm:pt-4">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-border/70 bg-gradient-to-br from-white via-white to-[#F6F7FB] shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="border-b border-border/70 px-6 py-7 sm:px-8 sm:py-9 lg:border-b-0 lg:border-r">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">
                Guide e costi
              </p>

              <h3 className="mt-3 max-w-[420px] text-[26px] font-semibold leading-[1.12] tracking-[-0.035em] text-secondary sm:text-[32px]">
                Non sai quanto può costare il tuo lavoro?
              </h3>

              <p className="mt-4 max-w-[460px] text-[14px] leading-7 text-muted-foreground">
                Consulta le guide FixPro per capire prezzi indicativi, esempi
                reali e cosa valutare prima di richiedere preventivi.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  href="/interventi"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Scopri tutti gli interventi
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/richiesta"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-secondary transition hover:bg-[#F6F7FB]"
                >
                  Richiedi preventivi
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="px-6 py-7 sm:px-8 sm:py-9">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-secondary">
                    Domande frequenti sui lavori più richiesti
                  </p>
                  <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
                    Apri una guida per vedere costi, esempi e consigli utili.
                  </p>
                </div>

                <Link
                  href="/interventi"
                  className="hidden text-[13px] font-semibold text-primary sm:inline-flex"
                >
                  Vedi tutte
                </Link>
              </div>

              <div className="space-y-3">
                {decisionPreviewLinks.map((slug) => {
                  const intervento = interventiBySlug[slug]

                  if (!intervento) {
                    return null
                  }

                  return (
                    <Link
                      key={slug}
                      href={`/interventi/${slug}`}
                      className="group flex items-center justify-between gap-4 rounded-[22px] border border-border/70 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                    >
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold leading-5 text-secondary">
                          Quanto costa {intervento.nome.toLowerCase()}?
                        </p>

                        <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
                          Consulta guida, prezzi indicativi ed esempi reali.
                        </p>
                      </div>

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6F7FB] text-primary transition group-hover:bg-primary group-hover:text-white">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  )
                })}
              </div>

              <div className="mt-5 rounded-[22px] border border-primary/15 bg-primary/5 px-4 py-4">
                <p className="text-[13px] font-semibold text-secondary">
                  Meglio arrivare preparati
                </p>
                <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
                  Sapere cosa incide sul prezzo ti aiuta a descrivere meglio il
                  lavoro e ricevere preventivi più chiari.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <HowItWorksSection />
      <PopularServicesSection />

      <HomeKnowledgeSection />
      <HomeReviewsSection />
      <HomeActivitySection />
      <BusinessSection />
      <DecisionLinksSection />
    </>
  )
}
