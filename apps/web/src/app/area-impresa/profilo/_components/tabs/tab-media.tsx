'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { ImageIcon, Loader2, Lock, Save, Trash2, Upload } from 'lucide-react'
import { Button } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'
import { useUploadThing } from '@/lib/uploadthing'

interface TabMediaProps {
  companyId: string
  logoUrl: string
  descriptionExtended: string
  coverImageUrl: string
  portfolioImages: Array<{
    id: string
    url: string
    caption: string | null
    createdAt: string
  }>
  isShowcaseActive: boolean
}

function VetrinaLockBanner() {
  return (
    <div className="feature-panel flex items-start gap-3 px-5 py-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Lock className="h-4 w-4 stroke-primary" strokeWidth={1.9} />
      </div>

      <div>
        <p className="text-sm font-semibold text-secondary">
          Disponibile con Vetrina Premium
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Attiva la Vetrina Premium per aggiungere cover, portfolio lavori e
          descrizione estesa al tuo profilo pubblico.
        </p>
        <Link
          href="/area-impresa/vetrina/acquisto"
          className="secondary-link mt-2 inline-flex items-center gap-1 text-xs font-medium"
        >
          Scopri i piani {'->'}
        </Link>
      </div>
    </div>
  )
}

export function TabMedia({
  companyId,
  logoUrl: initialLogo,
  descriptionExtended: initialDesc,
  coverImageUrl: initialCover,
  portfolioImages: initialPortfolio,
  isShowcaseActive,
}: TabMediaProps) {
  const router = useRouter()
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const portfolioInputRef = useRef<HTMLInputElement | null>(null)

  const [logo, setLogo] = useState(initialLogo)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [logoSuccess, setLogoSuccess] = useState<string | null>(null)

  const [portfolio, setPortfolio] = useState(initialPortfolio)
  const [portfolioError, setPortfolioError] = useState<string | null>(null)
  const [portfolioSuccess, setPortfolioSuccess] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [desc, setDesc] = useState(initialDesc)
  const [cover, setCover] = useState(initialCover)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [mediaSuccess, setMediaSuccess] = useState(false)

  const { startUpload: startLogoUpload, isUploading: isUploadingLogo } =
    useUploadThing('companyLogoUploader', {
      onClientUploadComplete: (files) => {
        const uploaded = files[0]
        if (!uploaded) return

        setLogo(uploaded.url)
        setLogoSuccess('Logo aggiornato con successo.')
        setLogoError(null)
        router.refresh()
      },
      onUploadError: (error) => {
        setLogoError(error.message)
        setLogoSuccess(null)
      },
    })

  const { startUpload: startPortfolioUpload, isUploading: isUploadingPortfolio } =
    useUploadThing('companyPortfolioUploader', {
      onClientUploadComplete: () => {
        setPortfolioSuccess('Portfolio aggiornato con successo.')
        setPortfolioError(null)
        router.refresh()
      },
      onUploadError: (error) => {
        setPortfolioError(error.message)
        setPortfolioSuccess(null)
      },
    })

  const updateVetrina = trpc.showcase.company.updateProfile.useMutation({
    onSuccess: () => {
      setMediaSuccess(true)
      setMediaError(null)
      setTimeout(() => setMediaSuccess(false), 3000)
      router.refresh()
    },
    onError: (err) => setMediaError(err.message),
  })

  async function handleLogoFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return

    setLogoError(null)
    setLogoSuccess(null)
    await startLogoUpload([file], { companyId })
  }

  async function handlePortfolioFiles(files: FileList | null) {
    const selectedFiles = Array.from(files ?? [])
    if (selectedFiles.length === 0) return

    setPortfolioError(null)
    setPortfolioSuccess(null)
    await startPortfolioUpload(selectedFiles, { companyId })
  }

  async function handleDeletePortfolioImage(imageId: string) {
    setDeletingId(imageId)
    setPortfolioError(null)
    setPortfolioSuccess(null)

    try {
      const response = await fetch(`/api/company-portfolio/${imageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error ?? "Impossibile eliminare l'immagine.")
      }

      setPortfolio((prev) => prev.filter((image) => image.id !== imageId))
      setPortfolioSuccess('Immagine rimossa dal portfolio.')
      router.refresh()
    } catch (error) {
      setPortfolioError(
        error instanceof Error ? error.message : "Impossibile eliminare l'immagine.",
      )
    } finally {
      setDeletingId(null)
    }
  }

  function handleVetrinaSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateVetrina.mutate({
      descriptionExtended: desc || undefined,
      coverImageUrl: cover || '',
    })
  }

  return (
    <div className="space-y-6">
      <section className="surface-card space-y-4 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ImageIcon className="h-4 w-4 stroke-primary" strokeWidth={1.9} />
          </div>

          <div>
            <h3 className="font-semibold text-secondary">Logo impresa</h3>
            <p className="text-sm text-muted-foreground">
              Il logo compare nel profilo pubblico e nelle notifiche. Disponibile
              per tutti.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-4 rounded-[22px] border border-border bg-[#F6F7FB] p-4">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[18px] border border-border bg-white">
              {logo ? (
                <Image
                  src={logo}
                  alt="Preview logo"
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized={logo.toLowerCase().includes('.svg')}
                />
              ) : (
                <ImageIcon className="h-5 w-5 stroke-muted-foreground" strokeWidth={1.8} />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-medium text-secondary">Carica un file logo</p>
              <p className="text-xs text-muted-foreground">
                Formati supportati: JPG, PNG, WEBP e SVG. Dimensione massima 2 MB.
              </p>

              <div className="flex flex-wrap gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(event) => void handleLogoFiles(event.target.files)}
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="gap-2 rounded-full"
                >
                  {isUploadingLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.9} />
                  ) : (
                    <Upload className="h-4 w-4" strokeWidth={1.9} />
                  )}
                  {isUploadingLogo ? 'Caricamento...' : 'Carica logo'}
                </Button>
              </div>
            </div>
          </div>

          {logoError && (
            <p className="rounded-[18px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {logoError}
            </p>
          )}

          {logoSuccess && (
            <p className="rounded-[18px] border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              {logoSuccess}
            </p>
          )}
        </div>
      </section>

      <section className="surface-card space-y-4 px-5 py-5 sm:px-6">
        <div>
          <h3 className="font-semibold text-secondary">Media avanzati</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Cover, portfolio e descrizione estesa per il profilo pubblico completo.
          </p>
        </div>

        {!isShowcaseActive ? (
          <VetrinaLockBanner />
        ) : (
          <form onSubmit={handleVetrinaSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary">
                Descrizione estesa
              </label>
              <p className="text-xs text-muted-foreground">
                Una presentazione più dettagliata della tua attività (max 2000
                caratteri).
              </p>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                maxLength={2000}
                rows={6}
                placeholder="Racconta la tua storia, la tua esperienza, i tuoi punti di forza..."
                className="w-full resize-none rounded-[22px] border border-border bg-white px-4 py-3 text-sm text-secondary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-right text-xs text-muted-foreground">
                {desc.length}/2000
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary">URL Cover</label>
              <p className="text-xs text-muted-foreground">
                Immagine di copertina del profilo (formato 16:9 consigliato).
              </p>
              <input
                type="url"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-[22px] border border-border bg-white px-4 py-3 text-sm text-secondary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              {cover && (
                <div className="relative h-24 w-full overflow-hidden rounded-[18px] border border-border bg-muted">
                  <Image
                    src={cover}
                    alt="Preview cover"
                    fill
                    sizes="(min-width: 768px) 768px, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary">
                  Portfolio lavori ({portfolio.length}/10)
                </label>
                <p className="text-xs text-muted-foreground">
                  Carica immagini reali dei lavori completati. Il portfolio pubblico
                  usa solo questi asset come fonte unica.
                </p>
              </div>

              {portfolio.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {portfolio.map((image) => (
                    <div
                      key={image.id}
                      className="overflow-hidden rounded-[22px] border border-border bg-white shadow-sm ring-1 ring-border/40"
                    >
                      <div className="relative aspect-square bg-muted">
                        <Image
                          src={image.url}
                          alt={image.caption || 'Portfolio impresa'}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {new Date(image.createdAt).toLocaleDateString('it-IT')}
                        </span>

                        <button
                          type="button"
                          onClick={() => void handleDeletePortfolioImage(image.id)}
                          disabled={deletingId === image.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-destructive/40 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Elimina immagine portfolio"
                        >
                          {deletingId === image.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.9} />
                          ) : (
                            <Trash2 className="h-4 w-4" strokeWidth={1.9} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {portfolio.length < 10 && (
                <div className="rounded-[22px] border border-dashed border-border bg-[#F6F7FB] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        Aggiungi immagini al portfolio
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG o WEBP. Massimo 10 immagini totali.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        ref={portfolioInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={(event) => void handlePortfolioFiles(event.target.files)}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => portfolioInputRef.current?.click()}
                        disabled={isUploadingPortfolio}
                        className="gap-2 rounded-full"
                      >
                        {isUploadingPortfolio ? (
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.9} />
                        ) : (
                          <Upload className="h-4 w-4" strokeWidth={1.9} />
                        )}
                        {isUploadingPortfolio ? 'Caricamento...' : 'Carica immagini'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {portfolioError && (
                <p className="rounded-[18px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {portfolioError}
                </p>
              )}

              {portfolioSuccess && (
                <p className="rounded-[18px] border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                  {portfolioSuccess}
                </p>
              )}
            </div>

            {mediaError && (
              <p className="rounded-[18px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {mediaError}
              </p>
            )}

            {mediaSuccess && (
              <p className="rounded-[18px] border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                Media aggiornati con successo.
              </p>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateVetrina.isPending}
                className="primary-pill gap-2"
              >
                <Save className="h-4 w-4" strokeWidth={1.9} />
                {updateVetrina.isPending ? 'Salvataggio...' : 'Salva media'}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}