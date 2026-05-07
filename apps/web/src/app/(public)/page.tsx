import type { ComponentType } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  ClipboardList,
  MapPin,
  MessageSquareText,
  MousePointerClick,
  ShieldCheck,
  Star,
  Zap,
} from 'lucide-react'
import { SectionShell } from './_components/home/section-shell'
import { HomeFeaturedProfessionalsSection } from './_components/home/home-featured-professionals-section'
import { SectionIntro } from './_components/home/section-intro'
import { HomeKnowledgeSection } from './_components/home/home-knowledge-section'
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

const decisionPreviewLinks = ['rifacimento-bagno', 'tinteggiatura-casa', 'perdita-acqua'] as const

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
      iconWrap: 'bg-card/90 ring-primary/15',
      icon: 'text-primary',
    },
    green: {
      iconWrap: 'bg-card/90 ring-success/15',
      icon: 'text-success',
    },
    amber: {
      iconWrap: 'bg-card/90 ring-warning/20',
      icon: 'text-warning',
    },
  }[tone]

  return (
    <div className="text-center">
      <div
        className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full shadow-[0_10px_24px_rgba(15,23,42,0.08)] ring-1 ${toneClasses.iconWrap}`}
      >
        <Icon className={`h-5 w-5 ${toneClasses.icon}`} strokeWidth={2.1} />
      </div>

      <h3 className="text-secondary mx-auto mt-3 max-w-[120px] text-[13px] leading-5 font-semibold">
        {title}
      </h3>

      <p className="text-muted-foreground mx-auto mt-1 max-w-[125px] text-[11.5px] leading-5">
        {text}
      </p>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="bg-background relative overflow-hidden">
      <div className="absolute inset-0 hidden overflow-hidden lg:block">
        <div className="absolute inset-0 translate-x-[2%] scale-[1.03]">
          <Image
            src="/images/home/hero-real.webp"
            alt="Persona che usa FixPro per trovare un professionista per lavori di casa"
            fill
            quality={90}
            className="object-cover object-[45%_center]"
            sizes="100vw"
          />
        </div>

        <div
          className="from-background/86 via-background/24 absolute inset-0 bg-gradient-to-r to-transparent"
          aria-hidden="true"
        />

        <div
          className="from-background/42 via-background/10 absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r to-transparent"
          aria-hidden="true"
        />

        <div
          className="from-background/22 absolute inset-x-0 bottom-0 h-[12%] bg-gradient-to-t to-transparent"
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto max-w-[1240px]">
        <div className="grid lg:min-h-[620px] lg:grid-cols-[44%_56%]">
          <div className="relative z-20 flex items-center">
            <div className="w-full px-5 py-8 sm:px-7 sm:py-10 lg:px-8 lg:py-12 xl:px-9">
              <div className="w-full lg:max-w-[520px]">
                <h1 className="text-secondary max-w-[540px] text-[34px] leading-[1.02] font-bold sm:text-[42px] lg:text-[50px] xl:text-[54px]">
                  Il professionista giusto, a portata di richiesta.
                </h1>

                <p className="text-muted-foreground mt-4 max-w-[480px] text-[15px] leading-[1.6] sm:text-[16px]">
                  Cerca, invia la richiesta e ricevi risposta dai professionisti vicino a te.
                </p>

                <div className="bg-primary mt-5 h-1 w-16 rounded-full" />

                <div className="mt-7 max-w-[560px]">
                  <p className="text-secondary mb-2.5 text-[14px] font-semibold">
                    Di cosa hai bisogno?
                  </p>

                  <PublicHeroSearch />

                  <div className="mt-3">
                    <Link
                      href="/categorie"
                      className="text-primary hover:text-primary/80 text-[13px] font-medium transition"
                    >
                      Oppure esplora gli interventi più comuni
                    </Link>
                  </div>
                </div>

                <div className="mt-8 grid max-w-[460px] grid-cols-3 gap-4 sm:gap-6">
                  <HeroFeature
                    icon={ShieldCheck}
                    title="Professionisti verificati"
                    text="Solo esperti qualificati."
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

                <div className="border-border mt-8 border-t pt-5">
                  <div className="flex flex-wrap items-center gap-1.5 text-star">
                    <Star className="h-3.5 w-3.5 fill-current stroke-current" />
                    <Star className="h-3.5 w-3.5 fill-current stroke-current" />
                    <Star className="h-3.5 w-3.5 fill-current stroke-current" />
                    <Star className="h-3.5 w-3.5 fill-current stroke-current" />
                    <Star className="h-3.5 w-3.5 fill-current stroke-current" />

                    <span className="text-secondary ml-1.5 text-[13px] font-semibold">
                      4.8/5 da oltre 1.200 clienti
                    </span>
                  </div>

                  <p className="text-muted-foreground mt-1.5 text-[12.5px] leading-5">
                    Affidati a FixPro e trova il professionista giusto per te.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}

function HowStep({
  icon: Icon,
  title,
  text,
}: {
  icon: IconComponent
  title: string
  text: string
}) {
  return (
    <article className="border-border/70 relative overflow-hidden border-t py-5 pr-8 text-left">
      <Icon
        className="text-primary/15 pointer-events-none absolute top-4 right-0 h-16 w-16"
        strokeWidth={1.45}
        aria-hidden="true"
      />

      <div className="relative">
        <Icon className="text-primary mb-3 h-7 w-7" strokeWidth={1.7} />

        <h3 className="text-secondary text-[16px] leading-6 font-semibold">{title}</h3>

        <p className="text-muted-foreground mt-1.5 max-w-[260px] text-[13px] leading-6">{text}</p>
      </div>
    </article>
  )
}

function HowItWorksSection() {
  return (
    <div id="come-funziona" className="scroll-mt-20">
      <SectionShell tone="muted" spacing="md" className="relative overflow-hidden">
        <div className="relative">
          <SectionIntro
            eyebrow="Come funziona"
            title="Richiedi in pochi passi, risolvi senza stress."
            description="Descrivi il lavoro, ricevi risposte e scegli il professionista più adatto a te."
            align="center"
          />

          <div className="mt-8 grid gap-5 sm:grid-cols-3 lg:gap-7">
            <HowStep
              icon={ClipboardList}
              title="Descrivi il lavoro"
              text="Racconta cosa ti serve, aggiungi dettagli, foto e posizione."
            />

            <HowStep
              icon={MessageSquareText}
              title="Ricevi risposte"
              text="I professionisti interessati valutano la richiesta e ti rispondono."
            />

            <HowStep
              icon={MousePointerClick}
              title="Scegli con calma"
              text="Confronta chiarezza, disponibilità e profili prima di decidere."
            />
          </div>
        </div>
      </SectionShell>
    </div>
  )
}

function RequestPathCard({
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
  imageSrc: string
}) {
  const visibleItems = items.slice(0, 2)
  const hiddenCount = Math.max(items.length - visibleItems.length, 0)

  return (
    <Link href={href} className="group block h-full">
      <article className="ring-border/60 h-full overflow-hidden bg-card shadow-sm ring-1 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative aspect-[16/8.5] overflow-hidden rounded-tl-[30px] bg-muted">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.035]"
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 74vw"
          />

          <div
            className="absolute inset-0 bg-gradient-to-t from-black/16 via-transparent to-transparent"
            aria-hidden="true"
          />
        </div>

        <div className="px-3.5 pt-3.5 pb-4">
          <h3 className="text-secondary text-[18px] leading-[1.15] font-semibold tracking-[-0.02em]">
            {title}
          </h3>

          <p className="text-muted-foreground mt-1.5 text-[12.5px] leading-5">{text}</p>

          {visibleItems.length > 0 ? (
            <p className="text-muted-foreground mt-2.5 text-[11.5px] leading-5">
              <span className="text-secondary font-semibold">Interventi: </span>
              {visibleItems.join(' · ')}
              {hiddenCount > 0 ? (
                <span className="text-primary font-semibold"> · +{hiddenCount}</span>
              ) : null}
            </p>
          ) : null}

          <div className="text-primary mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
            Vedi interventi
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </div>
        </div>
      </article>
    </Link>
  )
}

function CommonRequestsSection() {
  const featuredRequestGroups = [
    {
      icon: 'bath',
      title: 'Bagno e sanitari',
      text: 'Rifacimenti, doccia, sanitari e lavori collegati al bagno.',
      imageSrc: '/images/home/service-areas/bagni-sanitari.webp',
    },
    {
      icon: 'house',
      title: 'Casa e ristrutturazioni',
      text: 'Lavori interni, cucina, muratura, pavimenti e finiture.',
      imageSrc: '/images/home/service-areas/casa-ristrutturazioni.webp',
    },
    {
      icon: 'droplets',
      title: 'Impianti e riparazioni',
      text: 'Perdite, climatizzazione, caldaia e interventi tecnici.',
      imageSrc: '/images/home/service-areas/impianti-riparazioni.webp',
    },
  ] as const

  return (
    <SectionShell tone="muted" spacing="md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionIntro
          eyebrow="Richieste comuni"
          title="Esplora i lavori più vicini alla tua esigenza."
          description="Parti da un’area di intervento e scopri quali lavori puoi richiedere."
        />

        <Link
          href="/categorie"
          className="text-primary hover:text-primary/80 inline-flex w-fit items-center gap-2 text-[14px] font-semibold transition"
        >
          Sfoglia le categorie professionali
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-3 md:gap-x-6 md:overflow-visible md:px-0 md:pb-0">
        {featuredRequestGroups.map((preview) => {
          const group = macroInterventoGroups.find((item) => item.icon === preview.icon)

          if (!group) {
            return null
          }

          return (
            <div
              key={group.slug}
              className="w-[72vw] max-w-[300px] shrink-0 snap-start md:w-auto md:max-w-none"
            >
              <RequestPathCard
                title={preview.title}
                text={preview.text}
                href={`/categorie/${group.slug}`}
                imageSrc={preview.imageSrc}
                items={group.interventoSlugs.flatMap((slug) => {
                  const nome = interventiBySlug[slug]?.nome
                  return nome ? [nome] : []
                })}
              />
            </div>
          )
        })}
      </div>

      <div className="border-border/70 mt-8 border-t pt-5">
        <p className="text-muted-foreground max-w-[760px] text-[13px] leading-6">
          Non sai quale categoria scegliere? Parti dal tipo di lavoro: FixPro ti aiuta a orientarti
          tra gli interventi e i professionisti compatibili.
        </p>
      </div>
    </SectionShell>
  )
}

function BusinessSection() {
  return (
    <section
      id="imprese"
      className="bg-muted relative scroll-mt-20 overflow-hidden py-10 sm:py-12 lg:py-14"
    >
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-12">
          <Link href="/registrati" className="group relative mx-auto block w-full max-w-[520px]">
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
            <div className="bg-primary mb-5 h-1 w-14 rounded-full" />

            <p className="text-primary text-[12px] font-semibold tracking-[0.14em] uppercase">
              Per i professionisti
            </p>

            <h2 className="text-secondary mt-2.5 max-w-[500px] text-[28px] leading-[1.1] font-semibold sm:text-[34px]">
              Vuoi ricevere richieste più adatte al tuo lavoro?
            </h2>

            <p className="text-muted-foreground mt-3 max-w-[520px] text-[14px] leading-7">
              Crea una presenza chiara su FixPro, mostra i servizi che offri e fatti trovare da
              clienti nella tua zona.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="border-primary border-l-[3px] pl-4">
                <h3 className="text-secondary text-[15px] font-semibold">
                  Presenta la tua attività
                </h3>
                <p className="text-muted-foreground mt-1.5 text-[13px] leading-6">
                  Racconta chi sei, quali lavori segui e in quali zone lavori.
                </p>
              </div>

              <div className="border-primary border-l-[3px] pl-4">
                <h3 className="text-secondary text-[15px] font-semibold">
                  Ricevi richieste pertinenti
                </h3>
                <p className="text-muted-foreground mt-1.5 text-[13px] leading-6">
                  Valuta richieste compatibili con servizi, territorio e disponibilità.
                </p>
              </div>
            </div>

            <Link
              href="/area-professionisti"
              className="text-primary hover:text-primary/80 mt-7 inline-flex items-center gap-2 text-[14px] font-semibold transition"
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
    <section className="bg-background pt-0 pb-12 sm:pb-14 lg:pb-16">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
        <div className="border-border/70 overflow-hidden rounded-[24px] border bg-gradient-to-br from-card via-card to-muted shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="border-border/70 border-b px-5 py-6 sm:px-7 sm:py-7 lg:border-r lg:border-b-0">
              <p className="text-primary text-[12px] font-semibold tracking-[0.14em] uppercase">
                Guide e costi
              </p>

              <h3 className="text-secondary mt-2.5 max-w-[420px] text-[24px] leading-[1.12] font-semibold sm:text-[30px]">
                Non sai quanto può costare il tuo lavoro?
              </h3>

              <p className="text-muted-foreground mt-3 max-w-[460px] text-[13px] leading-6">
                Consulta le guide FixPro per capire prezzi indicativi, esempi reali e cosa valutare
                prima di richiedere preventivi.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  href="/interventi"
                  className="bg-primary hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground transition"
                >
                  Scopri tutti gli interventi
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="px-5 py-6 sm:px-7 sm:py-7">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-secondary text-[13px] font-semibold">
                    Domande frequenti sui lavori più richiesti
                  </p>
                  <p className="text-muted-foreground mt-1 text-[13px] leading-6">
                    Apri una guida per vedere costi, esempi e consigli utili.
                  </p>
                </div>

                <Link
                  href="/interventi"
                  className="text-primary hidden text-[13px] font-semibold sm:inline-flex"
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
                      className="group border-border/70 hover:border-primary/25 flex items-center justify-between gap-4 rounded-[18px] border bg-card px-4 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="min-w-0">
                        <p className="text-secondary text-[15px] leading-5 font-semibold">
                          Quanto costa {intervento.nome.toLowerCase()}?
                        </p>

                        <p className="text-muted-foreground mt-1 text-[13px] leading-6">
                          Consulta guida, prezzi indicativi ed esempi reali.
                        </p>
                      </div>

                      <span className="text-primary group-hover:bg-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted transition group-hover:text-primary-foreground">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  )
                })}
              </div>

              <div className="border-primary/15 bg-primary/5 mt-4 rounded-[18px] border px-4 py-3.5">
                <p className="text-secondary text-[13px] font-semibold">
                  Meglio arrivare preparati
                </p>
                <p className="text-muted-foreground mt-1 text-[13px] leading-6">
                  Sapere cosa incide sul prezzo ti aiuta a descrivere meglio il lavoro e ricevere
                  preventivi più chiari.
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

      <HomeKnowledgeSection />
      <CommonRequestsSection />
      <HomeFeaturedProfessionalsSection />

      <BusinessSection />
      <DecisionLinksSection />
    </>
  )
}
