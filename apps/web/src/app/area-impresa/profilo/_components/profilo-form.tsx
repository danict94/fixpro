'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Bell, Building2, Info } from 'lucide-react'
import { Button, Input, Card, CardContent, cn, AddressAutocomplete } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'
import type { api } from '@/lib/trpc/server'

type Settori = Awaited<ReturnType<typeof api.taxonomy.getSettori>>

interface ProfiloFormProps {
  isSetup: boolean
  settori: Settori
  initialData: {
    selectedCategoriaIds: string[]
    city: string
    province: string
    radiusKm: number
    description: string
    phone: string
    website: string
    notificationEmail: boolean
    notificationWhatsapp: boolean
  }
}

const PROVINCE_IT = [
  'AG','AL','AN','AO','AR','AP','AT','AV','BA','BT','BL','BN','BG','BI','BO','BZ','BS','BR',
  'CA','CL','CB','CI','CE','CT','CZ','CH','CO','CS','CR','KR','CN','EN','FM','FE','FI','FG',
  'FC','FR','GE','GO','GR','IM','IS','SP','AQ','LT','LE','LC','LI','LO','LU','MC','MN','MS',
  'MT','ME','MI','MO','MB','NA','NO','NU','OG','OT','OR','PD','PA','PR','PV','PG','PU','PE',
  'PC','PI','PT','PN','PZ','PO','RG','RA','RC','RE','RI','RN','RO','SA','VS','SS','SV','SI',
  'SR','SO','TA','TE','TR','TO','TP','TN','TV','TS','UD','VA','VE','VB','VC','VR','VV','VI','VT',
]

export function ProfiloForm({ isSetup, settori, initialData }: ProfiloFormProps) {
  const router = useRouter()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialData.selectedCategoriaIds),
  )
  const [city, setCity] = useState(initialData.city)
  const [province, setProvince] = useState(initialData.province)
  const [lat, setLat] = useState<number | undefined>(undefined)
  const [lng, setLng] = useState<number | undefined>(undefined)
  const [cap, setCap] = useState('')
  const [streetNumber, setStreetNumber] = useState('')
  const [googlePlaceId, setGooglePlaceId] = useState('')
  const [radiusKm, setRadiusKm] = useState(initialData.radiusKm)
  const [description, setDescription] = useState(initialData.description)
  const [phone, setPhone] = useState(initialData.phone)
  const [website, setWebsite] = useState(initialData.website)
  const [notificationEmail, setNotificationEmail] = useState(initialData.notificationEmail)
  const [notificationWhatsapp, setNotificationWhatsapp] = useState(initialData.notificationWhatsapp)
  const [error, setError] = useState<string | null>(null)

  const updateCategories = trpc.company.updateCategories.useMutation()
  const updateProfile = trpc.company.updateProfile.useMutation()

  const isPending = updateCategories.isPending || updateProfile.isPending

  function toggleCategoria(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (selectedIds.size === 0) {
      setError('Seleziona almeno una categoria di competenza.')
      return
    }
    if (!city.trim()) {
      setError('Inserisci la città di copertura.')
      return
    }

    try {
      await Promise.all([
        updateCategories.mutateAsync({ categoriaIds: Array.from(selectedIds) }),
        updateProfile.mutateAsync({
          city: city.trim(),
          province: province.trim() || undefined,
          cap: cap.trim() || undefined,
          streetNumber: streetNumber.trim() || undefined,
          lat,
          lng,
          googlePlaceId: googlePlaceId || undefined,
          radiusKm,
          description: description.trim() || undefined,
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
          notificationEmail,
          notificationWhatsapp,
        }),
      ])
      router.push('/area-impresa/dashboard')
      router.refresh()
    } catch {
      setError('Si è verificato un errore. Riprova.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Categorie professionali ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 stroke-primary" strokeWidth={1.9} />
            </div>
            <div>
              <p className="font-semibold text-foreground">Categorie professionali</p>
              <p className="text-xs text-muted-foreground">
                I settori qui sotto organizzano il catalogo. Le selezioni che salvi sono categorie professionali e vengono usate per il matching delle richieste.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {settori.map((settore) => (
              <div key={settore.id}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {settore.nome}
                </p>
                <div className="flex flex-wrap gap-2">
                  {settore.categorie.map((cat) => {
                    const selected = selectedIds.has(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategoria(cat.id)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150',
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5',
                        )}
                      >
                        {cat.nome}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Zona di copertura ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <MapPin className="h-4 w-4 stroke-success" strokeWidth={1.9} />
            </div>
            <div>
              <p className="font-semibold text-foreground">Zona di copertura</p>
              <p className="text-xs text-muted-foreground">
                Riceverai richieste entro il raggio selezionato dalla tua città.
              </p>
            </div>
          </div>

          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
            <div className="mb-4 space-y-1.5">
              <label className="text-sm font-medium text-foreground">Cerca indirizzo sede</label>
              <AddressAutocomplete
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                placeholder="Inizia a digitare l'indirizzo…"
                onAddressChange={(r) => {
                  if (r.city) setCity(r.city)
                  if (r.province) setProvince(r.province)
                  if (r.postalCode) setCap(r.postalCode)
                  if (r.streetNumber) setStreetNumber(r.streetNumber)
                  if (r.lat !== null) setLat(r.lat)
                  if (r.lng !== null) setLng(r.lng)
                  if (r.googlePlaceId) setGooglePlaceId(r.googlePlaceId)
                }}
              />
              <p className="text-xs text-muted-foreground">Città e provincia si compilano in automatico</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="city">
                Città *
              </label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Es. Milano"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="province">
                Provincia
              </label>
              <select
                id="province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Seleziona</option>
                {PROVINCE_IT.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Raggio di copertura</label>
              <span className="text-sm font-bold text-primary">{radiusKm} km</span>
            </div>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 km</span>
              <span>200 km</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Notifiche ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <Bell className="h-4 w-4 stroke-warning" strokeWidth={1.9} />
            </div>
            <div>
              <p className="font-semibold text-foreground">Preferenze notifiche</p>
              <p className="text-xs text-muted-foreground">
                Scegli come vuoi essere avvisato delle nuove richieste nella tua zona.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-3 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <p className="text-xs text-muted-foreground">Notifiche via email (consigliato)</p>
              </div>
              <input
                type="checkbox"
                checked={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-3 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-foreground">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Notifiche via WhatsApp (richiede numero verificato)</p>
              </div>
              <input
                type="checkbox"
                checked={notificationWhatsapp}
                onChange={(e) => setNotificationWhatsapp(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* ── Info azienda (opzionale) ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Info className="h-4 w-4 stroke-muted-foreground" strokeWidth={1.9} />
            </div>
            <div>
              <p className="font-semibold text-foreground">Info azienda <span className="text-xs font-normal text-muted-foreground">(opzionale)</span></p>
              <p className="text-xs text-muted-foreground">
                Queste informazioni compaiono nel tuo profilo pubblico e sono visibili ai clienti.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="description">
                Descrizione
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrivi brevemente la tua attività, i tuoi punti di forza e la tua esperienza..."
                rows={3}
                maxLength={1000}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="phone">
                  Telefono aziendale
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 02 1234567"
                />
                <p className="text-xs text-muted-foreground">
                  Questo numero è visibile ai clienti nel tuo profilo pubblico.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="website">
                  Sito web
                </label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.miaimpresa.it"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="min-w-36">
          {isPending
            ? 'Salvataggio...'
            : isSetup
              ? 'Completa profilo'
              : 'Salva modifiche'}
        </Button>
      </div>

    </form>
  )
}
