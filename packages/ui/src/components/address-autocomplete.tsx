'use client'

import * as React from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { cn } from '../lib/cn'

// ─── Risultato strutturato di un'autocomplete Google Places ──────────────────

export interface AddressResult {
  /** Indirizzo completo formattato, es. "Via Roma, 1, 20121 Milano MI, Italia" */
  formattedAddress: string
  /** Solo la via, es. "Via Roma" */
  street: string
  /** Numero civico, es. "1" */
  streetNumber: string
  /** Comune, es. "Milano" */
  city: string
  /** CAP, es. "20121". Può essere vuoto: Google Places non lo garantisce. */
  postalCode: string
  /** Sigla provincia (2 lettere), es. "MI" */
  province: string
  /** Regione, es. "Lombardia" */
  region: string
  /** Nazione (codice ISO 2), es. "IT" */
  country: string
  /** Latitudine (null se non disponibile o non valida) */
  lat: number | null
  /** Longitudine (null se non disponibile o non valida) */
  lng: number | null
  /** Google place_id per deduplicazione / arricchimento futuro */
  googlePlaceId: string
}

// ─── Props componente ─────────────────────────────────────────────────────────

export interface AddressAutocompleteProps {
  apiKey: string
  /**
   * Chiamata quando l'utente seleziona un indirizzo dai suggerimenti Google Places.
   * Tutti i campi dell'oggetto sono presenti. Le stringhe possono essere vuote se
   * Google non restituisce quel dato per il luogo selezionato.
   */
  onAddressChange: (result: AddressResult) => void
  placeholder?: string
  defaultValue?: string
  className?: string
  required?: boolean
  id?: string
}

// ─── Helper Google Places ─────────────────────────────────────────────────────

function findComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
): google.maps.GeocoderAddressComponent | undefined {
  return components.find((component) => component.types.includes(type))
}

function getLongName(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
): string {
  return findComponent(components, type)?.long_name.trim() ?? ''
}

function getShortName(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
): string {
  return findComponent(components, type)?.short_name.trim() ?? ''
}

function normalizeProvince(value: string): string {
  const normalized = value.trim().toUpperCase()

  if (!normalized) {
    return ''
  }

  return normalized.slice(0, 2)
}

function normalizeCountry(value: string): string {
  return value.trim().toUpperCase()
}

function resolveCity(components: google.maps.GeocoderAddressComponent[]): string {
  const cityCandidateTypes = [
    'locality',
    'postal_town',
    'administrative_area_level_3',
    'administrative_area_level_4',
    'administrative_area_level_2',
  ]

  for (const type of cityCandidateTypes) {
    const value = getLongName(components, type)

    if (value) {
      return value
    }
  }

  return ''
}

function resolveProvince(components: google.maps.GeocoderAddressComponent[]): string {
  const province = getShortName(components, 'administrative_area_level_2')

  if (province) {
    return normalizeProvince(province)
  }

  /**
   * Fallback molto prudente:
   * administrative_area_level_1 in Italia è spesso la regione, non la provincia.
   * Lo usiamo solo se Google restituisce già una sigla breve di 2 lettere.
   * Non vogliamo inventare province sbagliate tipo "SI" da "Sicilia".
   */
  const regionShortName = getShortName(components, 'administrative_area_level_1')
    .trim()
    .toUpperCase()

  if (/^[A-Z]{2}$/.test(regionShortName)) {
    return regionShortName
  }

  return ''
}

function resolveCoordinates(place: google.maps.places.PlaceResult): {
  lat: number | null
  lng: number | null
} {
  const lat = place.geometry?.location?.lat()
  const lng = place.geometry?.location?.lng()

  const hasValidCoordinates =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180

  if (!hasValidCoordinates) {
    return {
      lat: null,
      lng: null,
    }
  }

  return {
    lat,
    lng,
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function AddressAutocomplete({
  apiKey,
  onAddressChange,
  placeholder = 'Via Roma, 1 — Milano',
  defaultValue,
  className,
  required,
  id,
}: AddressAutocompleteProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null)
  const onAddressChangeRef = React.useRef(onAddressChange)

  React.useEffect(() => {
    onAddressChangeRef.current = onAddressChange
  }, [onAddressChange])

  React.useEffect(() => {
    if (!apiKey || !inputRef.current) return

    let cancelled = false

    async function initAutocomplete() {
      setOptions({ key: apiKey, v: 'weekly' })

      const placesLibrary = (await importLibrary('places')) as google.maps.PlacesLibrary
      const { Autocomplete } = placesLibrary

      if (!inputRef.current || cancelled) return

      autocompleteRef.current = new Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'it' },
        fields: ['address_components', 'geometry', 'place_id', 'formatted_address'],
        types: ['geocode'],
      })

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace()
        const components = place?.address_components

        if (!place || !components?.length) {
          return
        }

        const streetNumber = getLongName(components, 'street_number')
        const street = getLongName(components, 'route')
        const city = resolveCity(components)
        const province = resolveProvince(components)
        const postalCode = getLongName(components, 'postal_code')
        const region = getLongName(components, 'administrative_area_level_1')
        const country = normalizeCountry(getShortName(components, 'country'))
        const coordinates = resolveCoordinates(place)

        onAddressChangeRef.current({
          formattedAddress: place.formatted_address ?? '',
          street,
          streetNumber,
          city,
          postalCode,
          province,
          region,
          country,
          lat: coordinates.lat,
          lng: coordinates.lng,
          googlePlaceId: place.place_id ?? '',
        })
      })
    }

    initAutocomplete().catch(console.error)

    return () => {
      cancelled = true

      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
        autocompleteRef.current = null
      }
    }
  }, [apiKey])

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      placeholder={placeholder}
      defaultValue={defaultValue}
      required={required}
      autoComplete="off"
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
        'ring-offset-background placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors duration-150',
        className,
      )}
    />
  )
}