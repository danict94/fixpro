'use client'

import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import { Button, Input, AddressAutocomplete } from '@fixpro/ui'

interface StepLocationProps {
  mapsApiKey: string
  cap: string
  setCap: Dispatch<SetStateAction<string>>
  city: string
  setCity: Dispatch<SetStateAction<string>>
  address: string
  setAddress: Dispatch<SetStateAction<string>>
  streetNumber: string
  setStreetNumber: Dispatch<SetStateAction<string>>
  province: string
  setProvince: Dispatch<SetStateAction<string>>
  setLat: Dispatch<SetStateAction<number | null>>
  setLng: Dispatch<SetStateAction<number | null>>
  error: string | null
  onSubmit: FormEventHandler<HTMLFormElement>
}

export function StepLocation({
  mapsApiKey,
  cap,
  setCap,
  city,
  setCity,
  address,
  setAddress,
  streetNumber,
  setStreetNumber,
  province,
  setProvince,
  setLat,
  setLng,
  error,
  onSubmit,
}: StepLocationProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="surface-section space-y-5 px-5 py-5 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-secondary">Dove si svolge il lavoro?</p>
          <p className="muted-copy mt-1 text-sm">
            Inserisci la zona in cui dovranno operare i professionisti.
          </p>
        </div>

        {mapsApiKey && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Cerca indirizzo</label>
            <AddressAutocomplete
              apiKey={mapsApiKey}
              placeholder="Inizia a digitare l'indirizzo..."
              onAddressChange={(r) => {
                setAddress(r.street)
                setStreetNumber(r.streetNumber)
                setCity(r.city)
                setProvince(r.province)
                setCap(r.postalCode)
                setLat(r.lat)
                setLng(r.lng)
              }}
            />
            <p className="muted-copy text-xs">I campi sotto si compilano in automatico.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="cap" className="text-sm font-medium text-secondary">CAP</label>
            <Input id="cap" value={cap} onChange={(e) => setCap(e.target.value)} placeholder="20121" maxLength={10} inputMode="numeric" className="rounded-2xl border-border bg-white" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="city" className="text-sm font-medium text-secondary">Città <span className="text-danger">*</span></label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Milano" required className="rounded-2xl border-border bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="address" className="text-sm font-medium text-secondary">Indirizzo</label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Via Roma" className="rounded-2xl border-border bg-white" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="province" className="text-sm font-medium text-secondary">Provincia</label>
            <Input
              id="province"
              value={province}
              onChange={(e) => setProvince(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="MI"
              maxLength={2}
              className="rounded-2xl border-border bg-white uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="streetNumber" className="text-sm font-medium text-secondary">Civico</label>
            <Input id="streetNumber" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} placeholder="1" className="rounded-2xl border-border bg-white" />
          </div>
        </div>
      </div>

      {error && <p className="rounded-[18px] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">{error}</p>}
      <Button type="submit" className="primary-pill h-11 w-full text-sm font-semibold">Continua</Button>
    </form>
  )
}
