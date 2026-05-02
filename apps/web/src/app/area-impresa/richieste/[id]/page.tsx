import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Zap,
  CheckCircle,
  Lock,
  Phone,
  Mail,
  User,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Crown,
  Images,
  Users,
  XCircle,
  Clock,
} from 'lucide-react'
import {
  formatRequestDisplayTitle,
  formatRequestPublishedLabel,
  parseRequestDescription,
} from '@fixpro/shared'
import { auth } from '@/lib/auth'
import { api } from '@/lib/trpc/server'
import { prisma } from '@fixpro/db'
import { getPrivateAssetUrl } from '@/lib/uploadthing-server'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@fixpro/ui'
import { PurchaseButton } from './_components/purchase-button'
import { OneTimePurchaseButton } from './_components/one-time-button'

const URGENCY_LABEL: Record<string, string> = {
  WITHIN_1_MONTH: 'Urgente',
  WITHIN_3_MONTHS: 'Entro 3 mesi',
  WITHIN_6_MONTHS: 'Entro 6 mesi',
  NO_PREFERENCE: 'Nessuna preferenza',
}

const TIER_LABEL: Record<string, string> = {
  PRO: 'Vetrina Pro',
  PLUS: 'Vetrina Plus',
  BASE: 'Vetrina Base',
}

const TIER_ICON: Record<string, React.ReactNode> = {
  PRO: <Crown className="h-3.5 w-3.5" strokeWidth={2} />,
  PLUS: <Zap className="h-3.5 w-3.5" strokeWidth={2} />,
  BASE: <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />,
}

type RequestFulfillmentStatus =
  | 'processed'
  | 'already_processed'
  | 'pending_payment'
  | 'pending_capture'
  | 'ignored'

type RequestFulfillmentResult = {
  ok: boolean
  processed: boolean
  status: RequestFulfillmentStatus
  requestId?: string
  paymentIntentId?: string
}

async function getRequestFulfillmentResult(
  sessionId: string,
  cookieHeader: string,
  host: string | null,
  proto: string | null,
): Promise<RequestFulfillmentResult | null> {
  const baseUrl = process.env.BETTER_AUTH_URL ?? (host ? `${proto ?? 'http'}://${host}` : null)

  if (!baseUrl) {
    return null
  }

  try {
    const response = await fetch(`${baseUrl}/api/requests/fulfill`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify({ sessionId }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return response.json() as Promise<RequestFulfillmentResult>
  } catch {
    return null
  }
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getSuccessBannerMessage({
  purchased,
  fulfillment,
}: {
  purchased: boolean
  fulfillment: RequestFulfillmentResult | null
}) {
  if (purchased) {
    return {
      icon: CheckCircle,
      className: 'border-success/30 bg-success/10',
      iconClassName: 'stroke-success',
      message: 'Pagamento confermato. I dati di contatto sono disponibili qui sotto.',
    }
  }

  if (fulfillment?.status === 'pending_payment') {
    return {
      icon: Clock,
      className: 'border-warning/30 bg-warning/10',
      iconClassName: 'stroke-warning',
      message: 'Pagamento in attesa. Stiamo verificando la conferma finale da Stripe.',
    }
  }

  if (fulfillment?.status === 'pending_capture') {
    return {
      icon: Clock,
      className: 'border-warning/30 bg-warning/10',
      iconClassName: 'stroke-warning',
      message: 'Pagamento autorizzato. Stiamo completando la cattura e lo sblocco del contatto.',
    }
  }

  return {
    icon: Clock,
    className: 'border-warning/30 bg-warning/10',
    iconClassName: 'stroke-warning',
    message:
      'Pagamento registrato. Lo sblocco del contatto sarà disponibile appena completata la verifica.',
  }
}

export default async function RichiestaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; canceled?: string; session_id?: string }>
}) {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session?.user) redirect('/accedi')

  const { id } = await params
  const sp = await searchParams
  const success = sp.success === '1'
  const canceled = sp.canceled === '1'

  const fulfillment =
    success && sp.session_id
      ? await getRequestFulfillmentResult(
          sp.session_id,
          requestHeaders.get('cookie') ?? '',
          requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host'),
          requestHeaders.get('x-forwarded-proto'),
        )
      : null

  let richiesta: Awaited<ReturnType<typeof api.requests.getAvailable>>

  try {
    richiesta = await api.requests.getAvailable({ id })
  } catch {
    notFound()
  }

  const {
    purchased,
    purchaseId,
    purchasedAt,
    creditBalance,
    creditCost,
    oneTimePriceCents,
    categoria,
    servizio,
    buyerCount,
    hasOpenRescue,
    isDirectRequest,
    showcasePricing,
    showcaseOneTimePriceCents,
    showcaseTier,
  } = richiesta

  const successBanner = success
    ? getSuccessBannerMessage({
        purchased,
        fulfillment,
      })
    : null

  const effectiveCreditCost = showcasePricing?.finalCredits ?? creditCost
  const requestCode = `#${richiesta.id.slice(-8).toUpperCase()}`
  const parsedDescription = parseRequestDescription(richiesta.description)
  const displayTitle = formatRequestDisplayTitle({
    title: richiesta.title,
    interventoNome: richiesta.intervento?.nome,
    city: richiesta.city,
    province: richiesta.province,
  })
  const publishedAt = richiesta.approvedAt ?? richiesta.createdAt

  let requestImageUrls: Array<{ id: string; url: string }> = []

  if (richiesta.hasImages) {
    const requestImages = await prisma.requestImage.findMany({
      where: { requestId: richiesta.id },
      select: {
        id: true,
        storageKey: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    requestImageUrls = await Promise.all(
      requestImages.map(async (image) => ({
        id: image.id,
        url: await getPrivateAssetUrl(image.storageKey),
      })),
    )
  }

  const isClosed =
    !purchased && richiesta.maxBuyers !== null && buyerCount >= richiesta.maxBuyers

  return (
    <div className="space-y-6">
      {successBanner && (
        <div
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${successBanner.className}`}
        >
          <successBanner.icon
            className={`h-5 w-5 shrink-0 ${successBanner.iconClassName}`}
            strokeWidth={1.9}
          />
          <p className="text-sm font-medium text-foreground">{successBanner.message}</p>
        </div>
      )}

      {canceled && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <XCircle className="h-5 w-5 shrink-0 stroke-destructive" strokeWidth={1.9} />
          <p className="text-sm font-medium text-foreground">
            Pagamento annullato. Nessun contatto è stato sbloccato.
          </p>
        </div>
      )}

      <Link
        href="/area-impresa/richieste"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
        Torna alle richieste
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">{displayTitle}</CardTitle>
                    <span className="font-mono text-xs text-muted-foreground">
                      {requestCode}
                    </span>
                  </div>

                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {categoria.settore.nome} → {categoria.nome}
                    {servizio && ` → ${servizio.nome}`}
                  </p>

                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {formatRequestPublishedLabel(publishedAt)}
                    {richiesta.expiresAt && ` · Scade il ${formatDate(richiesta.expiresAt)}`}
                  </p>
                </div>

                {purchased && (
                  <Badge variant="outline" className="shrink-0 border-success/40 text-success">
                    <CheckCircle className="mr-1 h-3 w-3" strokeWidth={2} />
                    Acquistata
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                <span>
                  {[richiesta.address, richiesta.city, richiesta.province]
                    .filter(Boolean)
                    .join(', ') || 'Zona non specificata'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {richiesta.urgency && (
                  <Badge variant="outline" className="text-xs">
                    {URGENCY_LABEL[richiesta.urgency] ?? richiesta.urgency}
                  </Badge>
                )}

                {richiesta.propertyType && (
                  <Badge variant="outline" className="text-xs">
                    {richiesta.propertyType === 'RESIDENTIAL' ? 'Residenziale' : 'Commerciale'}
                  </Badge>
                )}

                {richiesta.hasImages && (
                  <Badge variant="outline" className="text-xs">
                    Con foto
                  </Badge>
                )}

                {richiesta.intention && (
                  <Badge variant="outline" className="text-xs">
                    {richiesta.intention === 'YES'
                      ? 'Pronto a procedere'
                      : richiesta.intention === 'MAYBE'
                        ? 'Forse'
                        : 'Solo informazioni'}
                  </Badge>
                )}

                {richiesta.maxBuyers !== null && (
                  <Badge variant="outline" className="text-xs">
                    <Users className="mr-1 h-3 w-3" strokeWidth={1.9} />
                    {buyerCount}/{richiesta.maxBuyers}
                  </Badge>
                )}

                {isClosed && (
                  <Badge variant="secondary" className="text-xs">
                    Richiesta chiusa
                  </Badge>
                )}
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Descrizione
                </p>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {parsedDescription.description}
                </p>
              </div>

              {parsedDescription.hasMeta && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Dimensioni lavoro
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {parsedDescription.meta.map((item) => (
                      <span
                        key={`${item.label}-${item.value}`}
                        className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground"
                      >
                        {item.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {requestImageUrls.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Images
                      className="h-4 w-4 shrink-0 stroke-muted-foreground"
                      strokeWidth={1.9}
                    />
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Immagini cliente
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {requestImageUrls.map((image) => (
                      <div
                        key={image.id}
                        className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                      >
                        <Image
                          src={image.url}
                          alt="Immagine allegata dal cliente"
                          fill
                          sizes="(min-width: 640px) 33vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {buyerCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {buyerCount} {buyerCount === 1 ? 'impresa ha' : 'imprese hanno'} già acquistato
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contatti cliente</CardTitle>
            </CardHeader>

            <CardContent>
              {purchased ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <User className="h-4 w-4 shrink-0 stroke-muted-foreground" strokeWidth={1.9} />
                    <span className="font-medium text-foreground">
                      {[richiesta.contactName, richiesta.contactSurname].filter(Boolean).join(' ')}
                    </span>
                  </div>

                  {richiesta.contactPhone && (
                    <div className="flex items-center gap-2.5">
                      <Phone
                        className="h-4 w-4 shrink-0 stroke-muted-foreground"
                        strokeWidth={1.9}
                      />
                      <a
                        href={`tel:${richiesta.contactPhone}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {richiesta.contactPhone}
                      </a>
                    </div>
                  )}

                  {richiesta.contactEmail && (
                    <div className="flex items-center gap-2.5">
                      <Mail
                        className="h-4 w-4 shrink-0 stroke-muted-foreground"
                        strokeWidth={1.9}
                      />
                      <a
                        href={`mailto:${richiesta.contactEmail}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {richiesta.contactEmail}
                      </a>
                    </div>
                  )}

                  {purchasedAt && (
                    <p className="text-xs text-muted-foreground">
                      Acquistata il {formatDate(purchasedAt)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-4">
                  <Lock
                    className="mt-0.5 h-4 w-4 shrink-0 stroke-muted-foreground"
                    strokeWidth={1.9}
                  />
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Contatti protetti</p>
                    <p className="text-xs leading-5">
                      Acquista questa richiesta per sbloccare nome, telefono ed email del cliente.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {!purchased && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {isDirectRequest ? 'Richiesta diretta per te' : 'Acquista richiesta'}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {isDirectRequest && (
                  <div className="space-y-1 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                      Richiesta diretta dal tuo profilo
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Inviata esclusivamente a te — solo tu puoi rispondere.
                    </p>
                  </div>
                )}

                {showcasePricing &&
                  showcaseTier &&
                  (showcasePricing.isFree ? (
                    <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2.5">
                      {TIER_ICON[showcaseTier]}
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-success">
                          Incluso nel tuo {TIER_LABEL[showcaseTier]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {showcasePricing.discountLabel} — quota mensile disponibile.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                      {TIER_ICON[showcaseTier]}
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-foreground">
                          Tariffa riservata {TIER_LABEL[showcaseTier]}:{' '}
                          {showcasePricing.finalCredits} crediti
                        </p>
                        <p className="text-xs text-muted-foreground">
                          invece di {showcasePricing.baseCredits} crediti — tariffa riservata al tuo piano.
                        </p>
                      </div>
                    </div>
                  ))}

                <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">I tuoi crediti</span>
                  <span className="font-semibold text-foreground">{creditBalance}</span>
                </div>

                {effectiveCreditCost !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Costo</span>
                    <div className="flex items-center gap-2">
                      {showcasePricing &&
                        !showcasePricing.isFree &&
                        showcasePricing.savedCredits > 0 && (
                          <span className="text-xs text-muted-foreground line-through">
                            {showcasePricing.baseCredits} cr
                          </span>
                        )}

                      <span className="flex items-center gap-1 font-semibold text-primary">
                        <Zap className="h-3.5 w-3.5" strokeWidth={2} />
                        {showcasePricing?.isFree ? 'Gratis' : `${effectiveCreditCost} crediti`}
                      </span>
                    </div>
                  </div>
                )}

                {effectiveCreditCost !== null ? (
                  <PurchaseButton
                    requestId={richiesta.id}
                    creditCost={effectiveCreditCost}
                    creditBalance={creditBalance}
                    isFree={showcasePricing?.isFree ?? false}
                    disabled={isClosed}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Costo crediti non ancora impostato.
                  </p>
                )}

                {oneTimePriceCents !== null && !showcasePricing?.isFree && (
                  <div className="space-y-3 border-t pt-3">
                    {showcasePricing &&
                      showcaseOneTimePriceCents !== null &&
                      showcaseOneTimePriceCents !== oneTimePriceCents && (
                        <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
                          {TIER_ICON[showcaseTier!]}
                          <div>
                            <span className="font-semibold text-foreground">
                              Tariffa riservata {TIER_LABEL[showcaseTier!]}: €
                              {(showcaseOneTimePriceCents / 100).toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-muted-foreground">
                              {' '}invece di{' '}
                              <span className="line-through">
                                €{(oneTimePriceCents / 100).toFixed(2).replace('.', ',')}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}

                    <OneTimePurchaseButton
                      requestId={richiesta.id}
                      amountCents={showcaseOneTimePriceCents ?? oneTimePriceCents}
                      disabled={isClosed}
                    />

                    <p className="text-center text-xs text-muted-foreground">
                      Senza crediti, pagamento singolo
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {purchased && purchaseId && (
            <Link href={`/area-impresa/contatti/${purchaseId}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-7 w-7 shrink-0 stroke-success" strokeWidth={1.5} />
                    <div>
                      <p className="font-semibold text-foreground">Richiesta acquistata</p>
                      <p className="text-xs text-muted-foreground">
                        I contatti sono sbloccati.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                    <MessageSquare className="h-4 w-4" strokeWidth={1.9} />
                    Scrivi al cliente
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {purchased && !hasOpenRescue && (
            <Link href={`/area-impresa/rimborsi?requestId=${richiesta.id}`}>
              <Card className="border-warning/30 transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="h-5 w-5 shrink-0 stroke-warning" strokeWidth={1.9} />
                    <div>
                      <p className="text-sm font-medium text-foreground">Richiedi rimborso</p>
                      <p className="text-xs text-muted-foreground">
                        Contatto non valido o irraggiungibile?
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 stroke-muted-foreground" strokeWidth={1.9} />
                </CardContent>
              </Card>
            </Link>
          )}

          {purchased && hasOpenRescue && (
            <Card className="border-muted opacity-70">
              <CardContent className="flex items-center gap-3 p-5">
                <RotateCcw className="h-5 w-5 shrink-0 stroke-muted-foreground" strokeWidth={1.9} />
                <div>
                  <p className="text-sm font-medium text-foreground">Rimborso già richiesto</p>
                  <p className="text-xs text-muted-foreground">
                    Hai già una richiesta di rimborso aperta per questa richiesta.{' '}
                    <Link href="/area-impresa/rimborsi" className="text-primary hover:underline">
                      Vedi stato →
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-1.5 p-5 text-xs text-muted-foreground">
              <p className="text-sm font-medium text-foreground">Come funziona</p>

              {isClosed && (
                <p>Il numero massimo di partecipanti per questa richiesta è stato raggiunto.</p>
              )}

              <p>
                Acquistando questa richiesta sblocchi i dati di contatto del cliente e puoi
                contattarlo direttamente.
              </p>
              <p>
                Pagamento con crediti: rimborso immediato in caso di contatto non valido.
              </p>
              <p>
                Pagamento una tantum: rimborso preferenziale in crediti più rapido; rimborso
                in euro tramite il nostro team richiede più tempo tecnico.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}