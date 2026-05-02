'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, Save, X } from 'lucide-react'
import { Button } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

interface DefaultValues {
  descriptionExtended: string
  logoUrl: string
  coverImageUrl: string
  galleryImages: string[]
}

export function VetrinaProfiloForm({
  defaultValues,
}: {
  defaultValues: DefaultValues
}) {
  const router = useRouter()
  const [desc, setDesc] = useState(defaultValues.descriptionExtended)
  const [logo, setLogo] = useState(defaultValues.logoUrl)
  const [cover, setCover] = useState(defaultValues.coverImageUrl)
  const [gallery, setGallery] = useState<string[]>(defaultValues.galleryImages)
  const [newGalleryUrl, setNewGalleryUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const save = trpc.showcase.company.updateProfile.useMutation({
    onSuccess: () => {
      setSuccess(true)
      setError(null)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  function addGalleryImage() {
    const url = newGalleryUrl.trim()
    if (!url) return

    if (gallery.length >= 10) {
      setError('Massimo 10 immagini nella gallery')
      return
    }

    setGallery((prev) => [...prev, url])
    setNewGalleryUrl('')
    setError(null)
  }

  function removeGalleryImage(index: number) {
    setGallery((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    save.mutate({
      descriptionExtended: desc || undefined,
      logoUrl: logo || '',
      coverImageUrl: cover || '',
      galleryImages: gallery,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Descrizione estesa */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Descrizione estesa
        </label>
        <p className="text-xs text-muted-foreground">
          Una presentazione più dettagliata della tua attività (max 2000 caratteri).
        </p>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          maxLength={2000}
          rows={6}
          placeholder="Racconta la tua storia, la tua esperienza, i tuoi punti di forza..."
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-right text-xs text-muted-foreground">
          {desc.length}/2000
        </p>
      </div>

      {/* URL Logo */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">URL Logo</label>
        <p className="text-xs text-muted-foreground">
          URL diretto all&apos;immagine del tuo logo (es. da UploadThing o altro servizio).
        </p>
        <input
          type="url"
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {logo && (
          <div className="relative mt-2 h-16 w-16 overflow-hidden rounded-lg border border-border bg-muted">
            <Image
              src={logo}
              alt="Preview logo"
              fill
              sizes="64px"
              className="object-cover"
              unoptimized={logo.toLowerCase().includes('.svg')}
            />
          </div>
        )}
      </div>

      {/* URL Cover */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">URL Cover</label>
        <p className="text-xs text-muted-foreground">
          Immagine di copertina del profilo (formato 16:9 consigliato).
        </p>
        <input
          type="url"
          value={cover}
          onChange={(e) => setCover(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {cover && (
          <div className="relative mt-2 h-24 w-full overflow-hidden rounded-lg border border-border bg-muted">
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

      {/* Gallery */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Gallery lavori ({gallery.length}/10)
        </label>
        <p className="text-xs text-muted-foreground">
          Aggiungi URL di immagini che mostrano i tuoi lavori realizzati.
        </p>

        {gallery.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {gallery.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                <Image
                  src={url}
                  alt={`Gallery ${i + 1}`}
                  fill
                  sizes="(min-width: 640px) 20vw, 33vw"
                  className="object-cover"
                />

                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Rimuovi immagine ${i + 1}`}
                >
                  <X
                    className="h-3 w-3 stroke-destructive-foreground"
                    strokeWidth={2.5}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {gallery.length < 10 && (
          <div className="flex gap-2">
            <input
              type="url"
              value={newGalleryUrl}
              onChange={(e) => setNewGalleryUrl(e.target.value)}
              placeholder="https://... (URL immagine)"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addGalleryImage()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addGalleryImage}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-success">Profilo aggiornato con successo.</p>
      )}

      <Button type="submit" disabled={save.isPending} className="gap-2">
        <Save className="h-4 w-4" strokeWidth={1.9} />
        {save.isPending ? 'Salvataggio…' : 'Salva modifiche'}
      </Button>
    </form>
  )
}