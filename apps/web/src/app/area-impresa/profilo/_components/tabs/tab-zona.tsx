'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { Button, Input, AddressAutocomplete } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

const PROVINCE_IT = [
  'AG','AL','AN','AO','AR','AP','AT','AV','BA','BT','BL','BN','BG','BI','BO','BZ','BS','BR',
  'CA','CL','CB','CI','CE','CT','CZ','CH','CO','CS','CR','KR','CN','EN','FM','FE','FI','FG',
  'FC','FR','GE','GO','GR','IM','IS','SP','AQ','LT','LE','LC','LI','LO','LU','MC','MN','MS',
  'MT','ME','MI','MO','MB','NA','NO','NU','OG','OT','OR','PD','PA','PR','PV','PG','PU','PE',
  'PC','PI','PT','PN','PZ','PO','RG','RA','RC','RE','RI','RN','RO','SA','VS','SS','SV','SI',
  'SR','SO','TA','TE','TR','TO','TP','TN','TV','TS','UD','VA','VE','VB','VC','VR','VV','VI','VT',
]

interface TabZonaProps {
  city: string
  province: string
  radiusKm: number
}

export function TabZona({ city: initialCity, province: initialProvince, radiusKm: initialRadius }: TabZonaProps) {
  const router = useRouter()

  const [city, setCity] = useState(initialCity)
  const [province, setProvince] = useState(initialProvince)
  const [radiusKm, setRadiusKm] = useState(initialRadius)
  const [lat, setLat] = useState<number | undefined>(undefined)
  const [lng, setLng] = useState<number | undefined>(undefined)
  const [cap, setCap] = useState('')
  const [streetNumber, setStreetNumber] = useState('')
  const [googlePlaceId, setGooglePlaceId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const update = trpc.company.updateProfile.useMutation({
    onSuccess: () => {
      setSuccess(true)
      setError(null)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!city.trim()) {
      setError('Inserisci la città di copertura.')
      return
    }
    setError(null)
    update.mutate({
      city: city.trim(),
      province: province.trim() || undefined,
      cap: cap.trim() || undefined,
      streetNumber: streetNumber.trim() || undefined,
      lat,
      lng,
      googlePlaceId: googlePlaceId || undefined,
      radiusKm,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="surface-section px-5 py-5 sm:px-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
            <MapPin className="h-4 w-4 stroke-success" strokeWidth={1.9} />
          </div>
          <div>
            <p className="font-semibold text-secondary">Zona di copertura</p>
            <p className="text-xs text-muted-foreground">
              Riceverai richieste entro il raggio selezionato dalla tua città.
            </p>
          </div>
        </div>

        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Cerca indirizzo sede</label>
            <AddressAutocomplete
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              placeholder="Inizia a digitare l'indirizzo o il comune..."
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

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary" htmlFor="city">
              Città *
            </label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Es. Milano"
              required
              className="rounded-2xl border-border bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary" htmlFor="province">
              Provincia
            </label>
            <select
              id="province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <label className="text-sm font-medium text-secondary">Raggio di copertura</label>
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
      </section>

      {error && <p className="rounded-[18px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {success && <p className="rounded-[18px] border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">Zona aggiornata con successo.</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending} className="primary-pill min-w-36">
          {update.isPending ? 'Salvataggio...' : 'Salva modifiche'}
        </Button>
      </div>
    </form>
  )
}
