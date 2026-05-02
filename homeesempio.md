import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  ShieldCheck,
  MapPin,
  Zap,
  Star,
  Wrench,
  PaintRoller,
  House,
  Truck,
  BriefcaseBusiness,
  CircleGauge,
  Send,
  Store,
  Inbox,
} from 'lucide-react'
import { PublicHeroSearch } from './_components/public-hero-search'

export const metadata: Metadata = {
  title: 'Trova professionisti per i lavori di casa | FixPro',
  description:
    'Trova il professionista giusto per i lavori di casa con una richiesta semplice e gratuita.',
}

function HeroFeature({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  text: string
}) {
  return (
    <div className="text-center lg:text-left">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/6 lg:mx-0">
        <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={2} />
      </div>

      <h3 className="mt-3 text-[14px] font-semibold leading-5 text-secondary">
        {title}
      </h3>

      <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
        {text}
      </p>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid lg:grid-cols-[40fr_60fr]">
          <div className="flex items-center bg-background">
            <div className="w-full px-5 py-5 sm:px-7 sm:py-7 lg:px-8 lg:py-7 xl:px-9">
              <div className="mx-auto max-w-[430px]">
                <div className="text-[32px] font-bold leading-none tracking-[-0.06em] text-secondary sm:text-[36px] lg:text-[38px]">
                  Fix<span className="text-primary">Pro</span>
                </div>

                <h1 className="mt-5 max-w-[420px] text-[32px] font-bold leading-[0.98] tracking-[-0.065em] text-secondary sm:text-[38px] lg:text-[44px] xl:text-[48px]">
                  Il professionista giusto, a portata di richiesta.
                </h1>

                <p className="mt-4 max-w-[400px] text-[15px] leading-[1.55] text-muted-foreground lg:text-[16px]">
                  Cerca, invia la richiesta e ricevi risposta dai professionisti vicino a te.
                </p>

                <div className="mt-4 h-1 w-14 rounded-full bg-primary" />

                <div className="mt-6">
                  <p className="mb-3 text-[14px] font-semibold text-secondary">
                    Di cosa hai bisogno?
                  </p>

                  <PublicHeroSearch />
                </div>

                <div className="mt-7 grid gap-6 sm:grid-cols-3 sm:gap-4">
                  <HeroFeature
                    icon={ShieldCheck}
                    title="Professionisti verificati"
                    text="Solo esperti qualificati e affidabili"
                  />

                  <HeroFeature
                    icon={MapPin}
                    title="Vicini a te, sempre"
                    text="Trova chi lavora nella tua zona"
                  />

                  <HeroFeature
                    icon={Zap}
                    title="Risposte rapide, lavori risolti"
                    text="Meno attese, più soluzioni"
                  />
                </div>

                <div className="mt-7 border-t border-border pt-4">
                  <div className="flex flex-wrap items-center gap-1.5 text-success">
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

          <div className="relative min-h-[360px] bg-[#f7f6fb] lg:min-h-[580px]">
            <Image
              src="/images/home/home_copia.PNG"
              alt="Illustrazione hero FixPro"
              fill
              priority
              className="object-cover object-center"
              sizes="(min-width: 1024px) 60vw, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function SectionIntro({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string
  title: string
  description?: string
  align?: 'left' | 'center'
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-[680px] text-center' : 'max-w-[460px]'}>
      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-primary">
        {eyebrow}
      </p>

      <h2 className="mt-3.5 text-[28px] font-bold leading-[1.04] tracking-[-0.06em] text-secondary sm:text-[34px] lg:text-[39px]">
        {title}
      </h2>

      {description ? (
        <p className="mt-3.5 text-[15px] leading-[1.65] text-muted-foreground sm:text-[16px]">
          {description}
        </p>
      ) : null}

      <div
        className={
          align === 'center'
            ? 'mx-auto mt-5 h-1 w-16 rounded-full bg-primary'
            : 'mt-5 h-1 w-16 rounded-full bg-primary'
        }
      />
    </div>
  )
}

function HowStep({
  number,
  title,
  text,
  imageSrc,
}: {
  number: string
  title: string
  text: string
  imageSrc?: string
}) {
  return (
    <div className="relative">
      <div className="rounded-[22px] border border-border bg-card p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[14px] font-semibold text-primary-foreground">
            {number}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[16px] bg-[#f7f6fb]">
          {imageSrc ? (
            <div className="relative h-[124px] w-full">
              <Image
                src={imageSrc}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width:1024px) 280px, 100vw"
              />
            </div>
          ) : (
            <div className="h-[124px] bg-[#f7f6fb]" />
          )}
        </div>
      </div>

      <h3 className="mt-3.5 text-[20px] font-semibold leading-[1.15] tracking-[-0.04em] text-secondary">
        {title}
      </h3>

      <p className="mt-2.5 text-[15px] leading-6 text-muted-foreground">
        {text}
      </p>
    </div>
  )
}

function HowItWorksSection() {
  return (
    <section className="bg-background px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_2.05fr] lg:items-start">
          <SectionIntro
            eyebrow="Come funziona"
            title="Richiedi in pochi passi, risolvi senza stress."
            description="Descrivi il lavoro, ricevi le risposte e scegli il professionista più adatto a te."
          />

          <div className="grid gap-7 md:grid-cols-3">
            <HowStep
              number="1"
              title="Descrivi il lavoro"
              text="Aggiungi dettagli, foto e la tua posizione."
            />
            <HowStep
              number="2"
              title="Ricevi le risposte"
              text="I professionisti interessati ti inviano la loro offerta."
            />
            <HowStep
              number="3"
              title="Scegli e inizia"
              text="Confronta, scegli e fai partire il lavoro."
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function ServiceCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  text: string
}) {
  return (
    <div className="rounded-[22px] border border-border bg-card p-5 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/6">
        <Icon className="h-6 w-6 text-primary" strokeWidth={1.9} />
      </div>

      <h3 className="mt-4 text-[20px] font-semibold tracking-[-0.04em] text-secondary">
        {title}
      </h3>

      <p className="mt-2.5 text-[14px] leading-6 text-muted-foreground">
        {text}
      </p>
    </div>
  )
}

function PopularServicesSection() {
  return (
    <section className="bg-[#f7f6fb] px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_2.1fr] lg:items-start">
          <SectionIntro
            eyebrow="I lavori più richiesti"
            title="Trova il professionista per ogni esigenza."
          />

          <div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <ServiceCard
                icon={Wrench}
                title="Idraulico"
                text="Interventi e impianti idraulici"
              />
              <ServiceCard
                icon={Zap}
                title="Elettricista"
                text="Impianti elettrici, guasti e molto altro"
              />
              <ServiceCard
                icon={PaintRoller}
                title="Imbianchino"
                text="Tinteggiature, pareti e decorazioni"
              />
              <ServiceCard
                icon={House}
                title="Impresa edile"
                text="Ristrutturazioni, opere e cantieri"
              />
              <ServiceCard
                icon={Truck}
                title="Traslochi"
                text="Traslochi e sgomberi"
              />
              <ServiceCard
                icon={BriefcaseBusiness}
                title="Manutenzione casa"
                text="Piccoli lavori e riparazioni"
              />
            </div>

            <div className="mt-6 flex justify-center">
              <Link
                href="/richiesta"
                className="inline-flex items-center gap-2 text-[15px] font-semibold text-primary"
              >
                Vedi tutti i servizi
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustItem({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  text: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/6">
        <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
      </div>

      <div>
        <h3 className="text-[17px] font-semibold leading-6 text-secondary">
          {title}
        </h3>
        <p className="mt-1.5 text-[14px] leading-6 text-muted-foreground">
          {text}
        </p>
      </div>
    </div>
  )
}

function ProfessionalCard({
  name,
  city,
  role,
  rating,
  reviews,
  imageSrc,
}: {
  name: string
  city: string
  role: string
  rating: string
  reviews: string
  imageSrc?: string
}) {
  return (
    <div className="rounded-[22px] border border-border bg-card p-5 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="relative mx-auto h-[72px] w-[72px] overflow-hidden rounded-full bg-muted">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : null}
      </div>

      <h3 className="mt-4 text-[17px] font-semibold text-secondary">
        {name}
      </h3>

      <div className="mt-1.5 flex items-center justify-center gap-1 text-[14px]">
        <Star className="h-4 w-4 fill-[#f4b400] stroke-[#f4b400]" />
        <span className="font-semibold text-secondary">{rating}</span>
        <span className="text-muted-foreground">({reviews})</span>
      </div>

      <div className="mt-1.5 flex items-center justify-center gap-1 text-[13px] text-muted-foreground">
        <MapPin className="h-4 w-4 text-success" strokeWidth={2} />
        <span>{city}</span>
      </div>

      <p className="mt-3 text-[14px] font-medium text-secondary">
        {role}
      </p>
    </div>
  )
}

function TrustAndProfessionistiSection() {
  return (
    <section className="bg-background px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div className="lg:border-r lg:border-border lg:pr-7">
            <SectionIntro
              eyebrow="Perché scegliere FixPro"
              title="Semplice, sicuro, affidabile."
            />

            <div className="mt-8 space-y-7">
              <TrustItem
                icon={ShieldCheck}
                title="Professionisti verificati"
                text="Ogni professionista è controllato e valutato dai clienti."
              />
              <TrustItem
                icon={Send}
                title="Richieste semplici e gratuite"
                text="Invia la tua richiesta in pochi secondi, senza impegno."
              />
              <TrustItem
                icon={CircleGauge}
                title="Confronta e scegli facilmente"
                text="Valuta le risposte e scegli il professionista migliore per te."
              />
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <SectionIntro
                eyebrow="Professionisti in evidenza"
                title="Professionisti affidabili, vicini a te."
              />

              <Link
                href="/area-cliente/professionisti"
                className="hidden items-center gap-2 text-[15px] font-semibold text-primary lg:inline-flex"
              >
                Vedi tutti
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ProfessionalCard
                name="Luca Bianchi"
                city="Milano"
                role="Idraulico"
                rating="4.9"
                reviews="128"
              />
              <ProfessionalCard
                name="Marco Rossi"
                city="Milano"
                role="Elettricista"
                rating="4.8"
                reviews="96"
              />
              <ProfessionalCard
                name="Giovanni Verdi"
                city="Milano"
                role="Imbianchino"
                rating="4.9"
                reviews="74"
              />
              <ProfessionalCard
                name="Antonio Conti"
                city="Milano"
                role="Impresa edile"
                rating="4.7"
                reviews="101"
              />
            </div>

            <div className="mt-6 flex justify-center lg:hidden">
              <Link
                href="/area-cliente/professionisti"
                className="inline-flex items-center gap-2 text-[15px] font-semibold text-primary"
              >
                Vedi tutti
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function BusinessBenefit({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  text: string
}) {
  return (
    <div className="text-left">
      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary/6">
        <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
      </div>

      <h3 className="mt-3.5 text-[17px] font-semibold leading-6 text-secondary">
        {title}
      </h3>

      <p className="mt-1.5 text-[14px] leading-6 text-muted-foreground">
        {text}
      </p>
    </div>
  )
}

function BusinessSection() {
  return (
    <section className="bg-[#f7f6fb] px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-8 rounded-[28px] bg-[#f3f1fd] px-5 py-7 sm:px-7 sm:py-9 lg:grid-cols-[1.05fr_1.2fr] lg:items-center lg:px-8 lg:py-9">
          <div className="max-w-[460px]">
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-primary">
              Per i professionisti
            </p>

            <h2 className="mt-3.5 text-[30px] font-bold leading-[1.04] tracking-[-0.06em] text-secondary sm:text-[36px] lg:text-[40px]">
              Sei un professionista e vuoi nuovi clienti?
            </h2>

            <p className="mt-4 text-[15px] leading-[1.65] text-muted-foreground sm:text-[16px]">
              Crea la tua vetrina su FixPro, fatti trovare nella tua zona e ricevi richieste in linea con il tuo lavoro.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-center">
            <BusinessBenefit
              icon={Store}
              title="Crea la tua vetrina"
              text="Presenta la tua attività con un profilo professionale."
            />
            <BusinessBenefit
              icon={MapPin}
              title="Aumenta la visibilità"
              text="Fatti trovare da chi cerca nella tua zona."
            />
            <BusinessBenefit
              icon={Inbox}
              title="Ricevi richieste mirate"
              text="Valuta richieste più in linea con i servizi che offri."
            />

            <div className="flex flex-col gap-2.5 lg:items-end">
              <Link href="/registrati" className="btn-primary whitespace-nowrap">
                Registra la tua attività
                <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2} />
              </Link>

              <Link
                href="/area-professionisti"
                className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-background px-5 py-2.5 text-sm font-semibold text-secondary transition hover:border-primary hover:text-primary"
              >
                Scopri l’area professionisti
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FinalCtaSection() {
  return (
    <section className="bg-background px-4 pb-12 sm:px-6 sm:pb-14 lg:px-8 lg:pb-16">
      <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[26px] bg-[#f3f1fd]">
        <div className="grid gap-7 px-5 py-7 sm:px-7 sm:py-9 lg:grid-cols-[1.1fr_auto_0.9fr] lg:items-center lg:px-8">
          <div className="max-w-[420px]">
            <h2 className="text-[30px] font-bold leading-[1.04] tracking-[-0.06em] text-secondary sm:text-[36px]">
              Descrivi il lavoro e trova il professionista giusto.
            </h2>

            <p className="mt-3.5 text-[15px] leading-[1.65] text-muted-foreground sm:text-[16px]">
              È gratuito, veloce e senza impegno.
            </p>
          </div>

          <div className="lg:justify-self-center">
            <Link href="/richiesta" className="btn-primary whitespace-nowrap">
              Invia la tua richiesta
              <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="relative hidden min-h-[160px] lg:block">
            <div className="absolute inset-0 rounded-l-[34px] bg-[linear-gradient(135deg,#f1effd_0%,#eceffd_100%)]" />
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
      <TrustAndProfessionistiSection />
      <BusinessSection />
      <FinalCtaSection />
    </>
  )
}
