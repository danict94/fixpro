'use client'

import * as React from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { cn } from '../lib/cn'

// ─── Risultato strutturato di un'autocomplete Google Places ──────────────────

export interface AddressResult {
  /** Indirizzo completo formattato, es. "Via Roma, 1, 20121 Milano MI, Italia" */
  formattedAddress: string
  /** Solo la via, es. "Via Roma" */
  street:           string
  /** Numero civico, es. "1" */
  streetNumber:     string
  /** Comune, es. "Milano" */
  city:             string
  /** CAP, es. "20121" */
  postalCode:       string
  /** Sigla provincia (2 lettere), es. "MI" */
  province:         string
  /** Regione, es. "Lombardia" */
  region:           string
  /** Nazione (codice ISO 2), es. "IT" */
  country:          string
  /** Latitudine (null se non disponibile) */
  lat:              number | null
  /** Longitudine (null se non disponibile) */
  lng:              number | null
  /** Google place_id per deduplicazione / arricchimento futuro */
  googlePlaceId:    string
}

// ─── Props componente ─────────────────────────────────────────────────────────

export interface AddressAutocompleteProps {
  apiKey: string
  /**
   * Chiamata quando l'utente seleziona un indirizzo dai suggerimenti Google Places.
   * Tutti i campi dell'oggetto sono presenti (possono essere stringa vuota se
   * Google non li restituisce per quell'indirizzo specifico).
   */
  onAddressChange: (result: AddressResult) => void
  placeholder?: string
  defaultValue?: string
  className?: string
  required?: boolean
  id?: string
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
  const inputRef       = React.useRef<HTMLInputElement>(null)
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null)

  React.useEffect(() => {
    if (!apiKey || !inputRef.current) return

    async function initAutocomplete() {
      setOptions({ key: apiKey, v: 'weekly' })

      const { Autocomplete } = await importLibrary('places') as google.maps.PlacesLibrary

      if (!inputRef.current) return

      autocompleteRef.current = new Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'it' },
        fields: ['address_components', 'geometry', 'place_id', 'formatted_address'],
        types: ['geocode'],
      })

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current!.getPlace()
        if (!place.address_components) return

        let streetNumber   = ''
        let route          = ''
        let city           = ''
        let province       = ''
        let postalCode     = ''
        let region         = ''
        let country        = ''

        for (const component of place.address_components) {
          const types = component.types
          if (types.includes('street_number')) {
            streetNumber = component.long_name
          } else if (types.includes('route')) {
            route = component.long_name
          } else if (types.includes('locality')) {
            city = component.long_name
          } else if (types.includes('administrative_area_level_2')) {
            // short_name restituisce la sigla (es. "MI", "RM")
            province = component.short_name.slice(0, 2).toUpperCase()
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name
          } else if (types.includes('administrative_area_level_1')) {
            region = component.long_name
          } else if (types.includes('country')) {
            country = component.short_name.toUpperCase()
          }
        }

        // Fallback: piccoli comuni italiani possono comparire come
        // administrative_area_level_3 invece di locality
        if (!city) {
          for (const comp of place.address_components!) {
            if (comp.types.includes('administrative_area_level_3')) {
              city = comp.long_name
              break
            }
          }
        }

        // street = solo la via, senza civico
        const street = route

        const lat = place.geometry?.location?.lat() ?? null
        const lng = place.geometry?.location?.lng() ?? null

        onAddressChange({
          formattedAddress: place.formatted_address ?? '',
          street,
          streetNumber,
          city,
          postalCode,
          province,
          region,
          country,
          lat,
          lng,
          googlePlaceId: place.place_id ?? '',
        })
      })
    }

    initAutocomplete().catch(console.error)

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [apiKey, onAddressChange])

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
