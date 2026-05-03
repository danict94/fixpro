'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { Button, Input, AddressAutocomplete } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

const PROVINCE_IT = [
  'AG',
  'AL',
  'AN',
  'AO',
  'AR',
  'AP',
  'AT',
  'AV',
  'BA',
  'BT',
  'BL',
  'BN',
  'BG',
  'BI',
  'BO',
  'BZ',
  'BS',
  'BR',
  'CA',
  'CL',
  'CB',
  'CI',
  'CE',
  'CT',
  'CZ',
  'CH',
  'CO',
  'CS',
  'CR',
  'KR',
  'CN',
  'EN',
  'FM',
  'FE',
  'FI',
  'FG',
  'FC',
  'FR',
  'GE',
  'GO',
  'GR',
  'IM',
  'IS',
  'SP',
  'AQ',
  'LT',
  'LE',
  'LC',
  'LI',
  'LO',
  'LU',
  'MC',
  'MN',
  'MS',
  'MT',
  'ME',
  'MI',
  'MO',
  'MB',
  'NA',
  'NO',
  'NU',
  'OG',
  'OT',
  'OR',
  'PD',
  'PA',
  'PR',
  'PV',
  'PG',
  'PU',
  'PE',
  'PC',
  'PI',
  'PT',
  'PN',
  'PZ',
  'PO',
  'RG',
  'RA',
  'RC',
  'RE',
  'RI',
  'RN',
  'RO',
  'SA',
  'VS',
  'SS',
  'SV',
  'SI',
  'SR',
  'SO',
  'TA',
  'TE',
  'TR',
  'TO',
  'TP',
  'TN',
  'TV',
  'TS',
  'UD',
  'VA',
  'VE',
  'VB',
  'VC',
  'VR',
  'VV',
  'VI',
  'VT',
]

interface TabZonaProps {
  city: string
  province: string
  radiusKm: number
}

function normalizeProvince(value: string): string {
  return value.trim().toUpperCase().slice(0, 2)
}

function hasValidCoordinates(lat: number | undefined, lng: number | undefined): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

export function TabZona({
  city: initialCity,
  province: initialProvince,
  radiusKm: initialRadius,
}: TabZonaProps) {
  const router = useRouter()
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

  const [city, setCity] = useState(initialCity)
  const [province, setProvince] = useState(normalizeProvince(initialProvince))
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
      window.setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  function clearGeoPrecision() {
    setLat(undefined)
    setLng(undefined)
    setGooglePlaceId('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedCity = city.trim()
    const normalizedProvince = normalizeProvince(province)
    const hasPreciseCoordinates = hasValidCoordinates(lat, lng)

    if (!normalizedCity) {
      setError('Inserisci la città di copertura.')
      return
    }

    if (!hasPreciseCoordinates && !normalizedProvince) {
      setError(
        'Seleziona un risultato dai suggerimenti oppure indica la provincia per impostare correttamente la zona.',
      )
      return
    }

    setError(null)

    update.mutate({
      city: normalizedCity,
      province: normalizedProvince || undefined,
      cap: cap.trim() || undefined,
      streetNumber: streetNumber.trim() || undefined,
      lat: hasPreciseCoordinates ? lat : null,
      lng: hasPreciseCoordinates ? lng : null,
      googlePlaceId: hasPreciseCoordinates ? googlePlaceId || null : null,
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

        {mapsApiKey && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Cerca indirizzo sede</label>
            <AddressAutocomplete
              apiKey={mapsApiKey}
              placeholder="Inizia a digitare l'indirizzo o il comune..."
              onAddressChange={(result) => {
                if (result.city) {
                  setCity(result.city)
                }

                if (result.province) {
                  setProvince(normalizeProvince(result.province))
                }

                setCap(result.postalCode)

                if (result.streetNumber) {
                  setStreetNumber(result.streetNumber)
                }

                if (result.lat !== null && result.lng !== null) {
                  setLat(result.lat)
                  setLng(result.lng)
                } else {
                  setLat(undefined)
                  setLng(undefined)
                }

                setGooglePlaceId(result.googlePlaceId)
              }}
            />
            <p className="text-xs text-muted-foreground">
              Seleziona un risultato dai suggerimenti per calcolare meglio il raggio. Se il CAP
              non compare, puoi continuare comunque.
            </p>
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
              onChange={(event) => {
                setCity(event.target.value)
                clearGeoPrecision()
              }}
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
              onChange={(event) => {
                setProvince(normalizeProvince(event.target.value))
                clearGeoPrecision()
              }}
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Seleziona</option>
              {PROVINCE_IT.map((provinceCode) => (
                <option key={provinceCode} value={provinceCode}>
                  {provinceCode}
                </option>
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
            onChange={(event) => setRadiusKm(Number(event.target.value))}
            className="w-full accent-primary"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 km</span>
            <span>200 km</span>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-[18px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-[18px] border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Zona aggiornata con successo.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending} className="primary-pill min-w-36">
          {update.isPending ? 'Salvataggio...' : 'Salva modifiche'}
        </Button>
      </div>
    </form>
  )
}