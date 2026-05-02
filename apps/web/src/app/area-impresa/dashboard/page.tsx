import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BellRing,
  Check,
  ClipboardCheck,
  CreditCard,
  FileText,
  MapPin,
  MessageCircle,
  Navigation,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  UserCheck,
  Wrench,
  Crown,
} from 'lucide-react'

import { auth } from '@/lib/auth'
import { prisma } from '@fixpro/db'
import { getAvailableCreditBalanceReadOnly } from '@fixpro/api/credit-balance'
import { expireShowcaseSubscriptions } from '@fixpro/api/showcase-subscription'
import { formatRequestDisplayTitle, formatRequestPublishedLabel } from '@fixpro/shared'
import { api } from '@/lib/trpc/server'
import { Badge } from '@fixpro/ui'
import { Card } from '@/components/ui/Card'
import { RequestsZonaSorted } from './_components/requests-zona-sorted'

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}g fa`
  if (hours > 0) return `${hours}h fa`
  if (minutes > 0) return `${minutes}m fa`
  return 'Ora'
}

function isNew(date: Date, alreadyPurchased = 0): boolean {
  if (alreadyPurchased > 0) return false
  const now = new Date()
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  return days < 7
}

const URGENCY_LABEL: Record<string, string> = {
  WITHIN_1_MONTH: 'Urgente',
  WITHIN_3_MONTHS: 'Entro 3 mesi',
  WITHIN_6_MONTHS: 'Entro 6 mesi',
  NO_PREFERENCE: 'Nessuna preferenza',
}

const CTA_CLASS_NAME =
  'primary-pill px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow-soft)]'

function getCurrentTimestamp(): number {
  return Date.now()
}

function ActionCircle({
  href,
  icon,
  className = '',
}: {
  href: string
  icon: ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-white text-secondary shadow-[var(--shadow-soft)] ring-1 ring-border/70 transition hover:-translate-y-0.5 ${className}`}
    >
      {icon}
    </Link>
  )
}

function ShortcutCard({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="surface-card group flex min-h-[128px] flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>

        <ArrowRight
          className="h-4 w-4 shrink-0 text-secondary/70 transition group-hover:translate-x-1 group-hover:text-primary"
          strokeWidth={2.1}
        />
      </div>

      <div className="mt-5 space-y-1.5">
        <p className="text-[15px] font-semibold leading-snug tracking-[-0.015em] text-secondary">
          {title}
        </p>

        <p className="text-[13px] leading-5 text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}

function KpiCard({
  href,
  icon,
  toneClassName,
  label,
  value,
  helper,
  footer,
}: {
  href?: string
  icon: ReactNode
  toneClassName: string
  label: string
  value: ReactNode
  helper: string
  footer?: ReactNode
}) {
  const content = (
    <Card className="surface-card flex min-h-[154px] flex-col border-0 p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClassName}`}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-5 tracking-[-0.01em] text-muted-foreground">
            {label}
          </p>

          <div className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.03em] text-secondary">
            {value}
          </div>
        </div>
      </div>

      <p className="mt-4 text-[13px] leading-5 text-muted-foreground">{helper}</p>

      {footer ? <div className="mt-auto pt-4">{footer}</div> : null}
    </Card>
  )

  if (!href) return content

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  )
}

function HeroVisual() {
  return (
    <div className="pointer-events-none absolute bottom-0 right-0 h-[170px] w-[210px] overflow-hidden opacity-65 sm:h-[190px] sm:w-[235px] sm:opacity-75 lg:inset-y-0 lg:h-auto lg:w-[270px] lg:opacity-100">
      <div className="absolute right-5 top-7 h-28 w-28 rounded-full bg-white/10 blur-2xl sm:right-7 sm:h-32 sm:w-32" />
      <div className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-white/10 blur-3xl sm:h-44 sm:w-44" />

      <div className="absolute right-14 top-8 flex h-28 w-[70px] rotate-2 flex-col rounded-[20px] border-[4px] border-slate-950 bg-white p-1.5 shadow-[0_18px_38px_rgba(15,23,42,0.22)] sm:right-16 sm:h-32 sm:w-20 sm:rounded-[22px] lg:right-20">
        <div className="mx-auto mb-1.5 h-1.5 w-6 rounded-full bg-slate-950 sm:w-7" />

        <div className="flex flex-1 flex-col items-center justify-center rounded-[15px] bg-primary/10 sm:rounded-[17px]">
          <MapPin className="h-8 w-8 text-primary sm:h-9 sm:w-9" strokeWidth={2.4} />
          <div className="mt-2 h-1.5 w-9 rounded-full bg-primary/25 sm:mt-2.5 sm:w-10" />
          <div className="mt-1.5 h-1.5 w-6 rounded-full bg-primary/15 sm:w-7" />
        </div>
      </div>

      <div className="absolute right-[150px] top-[72px] flex h-9 w-9 -rotate-12 items-center justify-center rounded-2xl bg-white text-primary shadow-lg sm:right-[164px] sm:top-[74px] sm:h-10 sm:w-10 lg:right-[184px] lg:h-11 lg:w-11">
        <Wrench className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={2.4} />
      </div>

      <div className="absolute right-5 top-[76px] flex h-9 w-9 rotate-12 items-center justify-center rounded-2xl bg-warning text-white shadow-lg sm:right-6 sm:top-[78px] sm:h-10 sm:w-10 lg:right-[28px] lg:h-11 lg:w-11">
        <Settings className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={2.4} />
      </div>

      <div className="absolute right-[124px] top-[126px] flex h-9 w-9 rotate-[-8deg] items-center justify-center rounded-2xl bg-white text-primary shadow-lg sm:right-[138px] sm:top-[134px] sm:h-10 sm:w-10 lg:right-[154px] lg:h-11 lg:w-11">
        <MessageCircle className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={2.4} />
      </div>

      <div className="absolute right-[62px] top-[142px] flex h-8 w-8 rotate-12 items-center justify-center rounded-2xl bg-white/85 text-primary shadow-md sm:right-[68px] sm:top-[154px] sm:h-9 sm:w-9 lg:right-[76px]">
        <Navigation className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2.4} />
      </div>

      <div className="absolute right-[142px] top-6 flex h-8 w-8 items-center justify-center rounded-full bg-success text-white shadow-lg sm:right-[154px] sm:h-9 sm:w-9 lg:right-[172px]">
        <Check className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2.8} />
      </div>
    </div>
  )
}

export default async function ImpresaDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/accedi')

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    include: {
      categories: { select: { categoriaId: true } },
      creditBalance: { select: { total: true } },
      showcase: {
        select: {
          status: true,
          expiresAt: true,
          plan: { select: { tier: true, name: true } },
        },
      },
      _count: {
        select: {
          purchases: true,
          rescues: { where: { status: 'OPEN' } },
        },
      },
    },
  })

  if (!company) redirect('/registrati')

  await expireShowcaseSubscriptions(prisma, { companyId: company.id })

  const isProfileComplete = company.categories.length > 0 && company.city !== null
  if (!isProfileComplete) {
    redirect('/area-impresa/profilo?setup=1')
  }

  const firstName = session.user.name.split(' ')[0] ?? session.user.name
  const creditBalance = await getAvailableCreditBalanceReadOnly(prisma, company.id)
  const totalPurchases = company._count.purchases
  const openRescues = company._count.rescues
  const currentTimestamp = getCurrentTimestamp()

  const showcase = company.showcase
  const isShowcaseActive = showcase?.status === 'ACTIVE' && showcase.expiresAt > new Date()
  const daysLeftShowcase = isShowcaseActive
    ? Math.ceil((showcase.expiresAt.getTime() - currentTimestamp) / (1000 * 60 * 60 * 24))
    : 0

  let allRichieste: Awaited<ReturnType<typeof api.requests.listAvailable>> = []
  try {
    allRichieste = await api.requests.listAvailable()
  } catch {
    // Silent: impresa potrebbe non avere ancora coordinate
  }

  const richiesteTargeted = allRichieste.filter((r) => r.isTargeted).slice(0, 2)
  const richiesteZona = allRichieste.filter((r) => !r.isTargeted).slice(0, 4)

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Dashboard
          </p>

          <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.04em] text-secondary sm:text-[38px]">
            Area impresa
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <ActionCircle
            href="/area-impresa/notifiche"
            icon={
              <span className="relative">
                <Bell className="h-5 w-5 text-secondary" strokeWidth={2.2} />
                <span className="absolute -right-0.5 -top-1 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-white" />
              </span>
            }
          />

          <ActionCircle
            href="/area-impresa/contatti"
            className="bg-success/10 text-success ring-success/15"
            icon={<MessageCircle className="h-5.5 w-5.5" strokeWidth={2.2} />}
          />

          <ActionCircle
            href="/area-impresa/profilo"
            icon={<User className="h-5.5 w-5.5 text-secondary" strokeWidth={2.2} />}
          />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative min-h-[300px] overflow-hidden rounded-[30px] bg-gradient-to-br from-primary via-primary to-[#8f84ff] px-6 py-7 pr-20 text-primary-foreground shadow-[var(--shadow-card)] sm:min-h-[280px] sm:px-7 sm:pr-40 lg:min-h-[250px] lg:pr-7">
          <div className="relative z-10 max-w-[560px]">
            <div className="text-2xl leading-none">👋</div>

            <h2 className="mt-4 max-w-[520px] text-[28px] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[36px]">
              La tua dashboard, {firstName}
            </h2>

            <p className="mt-4 max-w-[510px] text-[15px] leading-7 text-white/86">
              Controlla le nuove opportunità, gestisci i crediti e tieni aggiornato il profilo
              per ricevere richieste più compatibili con la tua impresa.
            </p>
          </div>

          <HeroVisual />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <ShortcutCard
            href="/area-impresa/richieste"
            title="Richieste disponibili"
            description="Apri la lista delle opportunità."
            icon={<FileText className="h-5.5 w-5.5" strokeWidth={2.2} />}
          />

          <ShortcutCard
            href="/area-impresa/crediti"
            title="Acquista crediti"
            description="Ricarica il saldo della tua impresa."
            icon={<ShoppingBag className="h-5.5 w-5.5" strokeWidth={2.2} />}
          />

          <ShortcutCard
            href="/area-impresa/profilo"
            title="Profilo impresa"
            description="Aggiorna categorie, zona e dati."
            icon={<User className="h-5.5 w-5.5" strokeWidth={2.2} />}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="surface-card flex min-h-[190px] flex-col border-0 p-6 shadow-[var(--shadow-soft)]">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserCheck className="h-6 w-6" strokeWidth={2.2} />
            </div>

            <div className="space-y-2">
              <h3 className="text-[19px] font-semibold leading-snug tracking-[-0.02em] text-secondary">
                Tieni il profilo aggiornato
              </h3>

              <p className="text-sm leading-6 text-muted-foreground">
                Verifica categorie, zona di copertura e dati di contatto: un profilo completo aiuta
                FixPro a mostrarti richieste più pertinenti.
              </p>
            </div>
          </div>

          <Link href="/area-impresa/profilo" className={`${CTA_CLASS_NAME} mt-5 w-full`}>
            Controlla profilo
            <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2.1} />
          </Link>
        </Card>

        <Card className="surface-card flex min-h-[190px] flex-col border-0 p-6 shadow-[var(--shadow-soft)]">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success/10 text-success">
              <MessageCircle className="h-6 w-6" strokeWidth={2.2} />
            </div>

            <div className="space-y-2">
              <h3 className="text-[19px] font-semibold leading-snug tracking-[-0.02em] text-secondary">
                Notifiche WhatsApp
              </h3>

              <p className="text-sm leading-6 text-muted-foreground">
                Gestisci le notifiche per non perdere nuove occasioni compatibili con la tua
                impresa.
              </p>
            </div>
          </div>

          <Link
            href="/area-impresa/notifiche"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-success/15 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success transition hover:bg-success/15"
          >
            Gestisci notifiche
            <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2} />
          </Link>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          href="/area-impresa/crediti"
          label="Crediti disponibili"
          value={creditBalance}
          helper="Saldo utilizzabile per acquistare nuovi contatti."
          icon={<CreditCard className="h-5.5 w-5.5" strokeWidth={2.2} />}
          toneClassName="bg-warning/10 text-warning"
          footer={
            <span className="secondary-link">
              Acquista crediti
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          }
        />

        <KpiCard
          href="/area-impresa/acquisti"
          label="Richieste acquistate"
          value={totalPurchases}
          helper="Totale delle richieste già sbloccate dalla tua impresa."
          icon={<ClipboardCheck className="h-5.5 w-5.5" strokeWidth={2.2} />}
          toneClassName="bg-primary/10 text-primary"
          footer={
            <span className="secondary-link">
              Vedi acquisti
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          }
        />

        <KpiCard
          label="Rescue aperti"
          value={openRescues}
          helper="Richieste di rimborso o supporto ancora in lavorazione."
          icon={<AlertCircle className="h-5.5 w-5.5" strokeWidth={2.2} />}
          toneClassName="bg-warning/10 text-warning"
          footer={
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-secondary">
              {openRescues > 0 ? 'Da gestire' : 'Nessun rescue aperto'}
            </span>
          }
        />

        <KpiCard
          href="/area-impresa/vetrina"
          label="Vetrina Premium"
          value={isShowcaseActive ? showcase?.plan?.name || 'Attiva' : 'Inattiva'}
          helper="Stato del piano vetrina e vantaggi attivi sul profilo pubblico."
          icon={<Crown className="h-5.5 w-5.5" strokeWidth={2.2} />}
          toneClassName="bg-primary/10 text-primary"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-secondary">
                {isShowcaseActive ? `Scade in ${daysLeftShowcase}g` : 'Non attiva'}
              </span>

              <span className="secondary-link">
                Gestisci
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
            </div>
          }
        />
      </section>

      {richiesteTargeted.length > 0 && (
        <section className="surface-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-primary text-primary-foreground">
                  Priorità alta
                </Badge>

                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Lead dirette
                </span>
              </div>

              <h2 className="pt-2 text-[22px] font-semibold leading-tight tracking-[-0.025em] text-secondary">
                {richiesteTargeted.length === 1 ? 'Richiesta diretta' : 'Richieste dirette'}
              </h2>

              <p className="text-sm leading-6 text-muted-foreground">
                Opportunità arrivate direttamente dal tuo profilo o dalla tua vetrina.
              </p>
            </div>

            <Link href="/area-impresa/richieste" className="secondary-link">
              Vedi tutte
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {richiesteTargeted.map((r) => {
              const isClosed =
                r.already_purchased === 0 && r.maxBuyers !== null && r.buyer_count >= r.maxBuyers

              const displayTitle = formatRequestDisplayTitle({
                title: r.title,
                interventoNome: r.interventoNome,
                city: r.city,
                province: r.province,
              })

              const publishedAt = r.approvedAt ?? r.createdAt

              return (
                <Link
                  key={r.id}
                  href={isClosed ? '#' : `/area-impresa/richieste/${r.id}`}
                  className={isClosed ? 'pointer-events-none' : undefined}
                >
                  <Card
                    className={`flex h-full flex-col gap-4 rounded-[22px] border-border/70 bg-muted/35 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[var(--shadow-soft)] ${
                      isClosed ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold leading-snug tracking-[-0.015em] text-secondary">
                            {displayTitle}
                          </p>

                          {r.already_purchased > 0 ? (
                            <Badge className="border border-success/20 bg-success/10 text-xs text-success">
                              Acquistata
                            </Badge>
                          ) : isNew(r.createdAt, r.already_purchased) ? (
                            <Badge className="border border-success/20 bg-success/10 text-xs text-success">
                              Nuovo
                            </Badge>
                          ) : null}
                        </div>

                        <p className="text-sm text-muted-foreground">{r.settoreNome}</p>
                      </div>

                      <Badge className="shrink-0 rounded-full bg-primary text-primary-foreground">
                        Diretta
                      </Badge>
                    </div>

                    <p className="text-sm leading-6 text-muted-foreground">
                      Richiesta con priorità alta per la tua impresa, pronta per essere valutata
                      subito.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {(r.city || r.province) && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" strokeWidth={1.9} />
                          <span>{[r.city, r.province].filter(Boolean).join(', ')}</span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5">
                        <BellRing className="h-4 w-4" strokeWidth={1.9} />
                        <span>{formatTimeAgo(r.createdAt)}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4" strokeWidth={1.9} />
                        <span>{formatRequestPublishedLabel(publishedAt)}</span>
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-4 border-t border-border pt-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Costo
                        </p>

                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-2xl font-semibold text-secondary">
                            {r.creditCost !== null ? r.creditCost : '-'}
                          </span>

                          {r.creditCost !== null && (
                            <span className="text-sm text-muted-foreground">crediti</span>
                          )}
                        </div>
                      </div>

                      {isClosed ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground">
                          Richiesta chiusa
                        </span>
                      ) : (
                        <span className={CTA_CLASS_NAME}>Apri richiesta</span>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {richiesteZona.length > 0 && (
        <section className="surface-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
          <RequestsZonaSorted requests={richiesteZona} urgencyLabel={URGENCY_LABEL} />
        </section>
      )}

      {richiesteTargeted.length === 0 && richiesteZona.length === 0 && (
        <section className="surface-card px-6 py-10 text-center shadow-[var(--shadow-soft)] sm:px-8">
          <div className="mx-auto flex max-w-[560px] flex-col items-center justify-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <Sparkles className="h-8 w-8" strokeWidth={1.7} />
            </div>

            <div className="space-y-1">
              <p className="text-lg font-semibold text-secondary">Nessuna richiesta disponibile</p>

              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                Torna più tardi oppure controlla categorie, zona di copertura e dati di contatto:
                un profilo aggiornato aumenta le possibilità di ricevere nuove opportunità.
              </p>
            </div>

            <Link href="/area-impresa/profilo" className={CTA_CLASS_NAME}>
              Controlla il profilo
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}