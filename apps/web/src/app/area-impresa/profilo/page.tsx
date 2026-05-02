import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  BellRing,
  Building2,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@fixpro/db'
import { expireShowcaseSubscriptions } from '@fixpro/api'
import { api } from '@/lib/trpc/server'
import { ProfiloTabs } from './_components/profilo-tabs'

export const metadata = { title: 'Profilo impresa' }

export default async function ProfiloPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; setup?: string }>
}) {
  const [session, settori, sp] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    api.taxonomy.getSettori(),
    searchParams,
  ])

  if (!session?.user) redirect('/accedi')

  const companyRef = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!companyRef) redirect('/registrati')

  await expireShowcaseSubscriptions(prisma, { companyId: companyRef.id })

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    include: {
      categories: { select: { categoriaId: true } },
      services: { select: { servizioId: true } },
      portfolioImages: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          url: true,
          caption: true,
          createdAt: true,
        },
      },
      showcase: {
        select: {
          status: true,
          expiresAt: true,
          plan: { select: { tier: true } },
        },
      },
    },
  })

  if (!company) redirect('/registrati')

  const isShowcaseActive =
    company.showcase?.status === 'ACTIVE' &&
    new Date(company.showcase.expiresAt) > new Date()

  const showcaseTier = isShowcaseActive ? (company.showcase?.plan.tier ?? null) : null

  const selectedCategoriaIds = company.categories.map((c) => c.categoriaId)
  const selectedServizioIds = company.services.map((service) => service.servizioId)

  const initialTab = sp.setup === '1' ? 'panoramica' : (sp.tab ?? 'panoramica')
  const isSetup = sp.setup === '1'

  const hasCategories = selectedCategoriaIds.length > 0
  const hasCity = Boolean(company.city)
  const hasContact = Boolean(company.phone || company.notificationEmail || company.notificationWhatsapp)
  const hasDescription = Boolean(company.description || company.descriptionExtended)
  const profileChecks = [hasCategories, hasCity, hasContact, hasDescription]
  const completedChecks = profileChecks.filter(Boolean).length

  return (
    <div className="page-section space-y-6 lg:space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-white via-white to-muted/40 px-5 py-6 shadow-sm sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[780px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-primary">
              Area impresa
            </p>

            <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-secondary sm:text-4xl">
              {isSetup && <span aria-hidden="true">👋</span>}
              <span>{isSetup ? 'Configura il tuo profilo' : 'Il mio profilo'}</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
              {isSetup
                ? 'Completa le informazioni principali per iniziare a ricevere richieste compatibili nella tua zona.'
                : 'Gestisci dati, copertura, categorie, media e impostazioni della tua impresa da un unico spazio ordinato.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="rounded-2xl border border-border bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-2xl font-semibold tracking-tight text-secondary">
                {completedChecks}/4
              </p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                profilo
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-2xl font-semibold tracking-tight text-secondary">
                {selectedCategoriaIds.length}
              </p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                categorie
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[1.5rem] border border-border bg-white px-5 py-4 shadow-sm sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Sparkles className="h-5 w-5" strokeWidth={2} />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-secondary">
                  Tieni il profilo sempre aggiornato
                </p>

                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Categorie, servizi, zona di copertura e descrizione aiutano FixPro a mostrarti
                  richieste più pertinenti. Più il profilo è preciso, più il matching sarà utile.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-primary/15 bg-primary/5 px-5 py-4 shadow-sm">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-primary/10">
              <BellRing className="h-5 w-5" strokeWidth={2} />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-secondary">Notifiche WhatsApp</p>

              <p className="text-sm leading-6 text-muted-foreground">
                Controlla che siano attive per non perdere nuove occasioni quando arrivano richieste
                compatibili.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-border bg-white px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-secondary ring-1 ring-border/70">
              <Building2 className="h-5 w-5" strokeWidth={2} />
            </div>

            <div>
              <p className="text-sm font-semibold text-secondary">Dati impresa</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {company.ragioneSociale}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-white px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-secondary ring-1 ring-border/70">
              <MapPin className="h-5 w-5" strokeWidth={2} />
            </div>

            <div>
              <p className="text-sm font-semibold text-secondary">Zona di copertura</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {company.city
                  ? [company.city, company.province].filter(Boolean).join(', ')
                  : 'Da completare'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-white px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-secondary ring-1 ring-border/70">
              {company.verified ? (
                <ShieldCheck className="h-5 w-5" strokeWidth={2} />
              ) : (
                <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-secondary">Stato profilo</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {company.verified ? 'Profilo verificato' : 'Profilo in gestione'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ProfiloTabs
        initialTab={initialTab}
        ragioneSociale={company.ragioneSociale}
        partitaIva={company.partitaIva ?? null}
        slug={company.slug}
        status={company.status}
        verified={company.verified}
        isShowcaseActive={isShowcaseActive}
        showcaseTier={showcaseTier}
        categoryCount={selectedCategoriaIds.length}
        city={company.city ?? null}
        description={company.description ?? null}
        phone={company.phone ?? null}
        logoUrl={company.logoUrl ?? null}
        galleryCount={company.portfolioImages.length}
        website={company.website ?? ''}
        workType={company.workType ?? 'BOTH'}
        settori={settori}
        selectedCategoriaIds={selectedCategoriaIds}
        selectedServizioIds={selectedServizioIds}
        province={company.province ?? ''}
        radiusKm={company.radiusKm}
        companyId={company.id}
        descriptionExtended={company.descriptionExtended ?? ''}
        coverImageUrl={company.coverImageUrl ?? ''}
        portfolioImages={company.portfolioImages.map((image) => ({
          ...image,
          createdAt: image.createdAt.toISOString(),
        }))}
        notificationEmail={company.notificationEmail}
        notificationWhatsapp={company.notificationWhatsapp}
      />
    </div>
  )
}