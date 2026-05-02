'use client'

import { useState } from 'react'
import type {
  Intention,
  MeasurementType,
  NuovaRichiestaWizardProps,
  PropertyType,
  Urgency,
  WorkType,
} from './types'

type InitialUser = NuovaRichiestaWizardProps['initialUser']

export function useRequestFormState({
  initialUser,
  initialInterventoId,
  initialCategoriaId,
  initialServizioId,
}: {
  initialUser?: InitialUser
  initialInterventoId?: string
  initialCategoriaId?: string
  initialServizioId?: string
}) {
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [cap, setCap] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [streetNumber, setStreetNumber] = useState('')
  const [province, setProvince] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  const [interventoId, setInterventoId] = useState(initialInterventoId ?? '')
  const [categoriaId, setCategoriaId] = useState(initialCategoriaId ?? '')
  const [servizioId, setServizioId] = useState(initialServizioId ?? '')
  const [searchQuery, setSearchQuery] = useState('')

  const [workType, setWorkType] = useState<WorkType>('UNKNOWN')
  const [description, setDescription] = useState('')
  const [surfaceMq, setSurfaceMq] = useState('')
  const [measurementType, setMeasurementType] = useState<MeasurementType>('mq')
  const [quantity, setQuantity] = useState('')

  const [propertyType, setPropertyType] = useState<PropertyType | ''>('')
  const [urgency, setUrgency] = useState<Urgency | ''>('')

  const [hasImages, setHasImages] = useState<boolean | null>(null)
  const [requestFiles, setRequestFiles] = useState<File[]>([])

  const [intention, setIntention] = useState<Intention | ''>('')

  const [contactName, setContactName] = useState(initialUser?.name ?? '')
  const [contactSurname, setContactSurname] = useState(initialUser?.surname ?? '')
  const [contactPhone, setContactPhone] = useState(initialUser?.phone ?? '')
  const [contactEmail, setContactEmail] = useState(initialUser?.email ?? '')

  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [otp, setOtp] = useState('')

  function clearMessages() {
    setError(null)
    setNotice(null)
  }

  return {
    step,
    setStep,
    error,
    setError,
    notice,
    setNotice,
    clearMessages,

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
    lat,
    setLat,
    lng,
    setLng,

    interventoId,
    setInterventoId,
    categoriaId,
    setCategoriaId,
    servizioId,
    setServizioId,
    searchQuery,
    setSearchQuery,

    workType,
    setWorkType,
    description,
    setDescription,
    surfaceMq,
    setSurfaceMq,
    measurementType,
    setMeasurementType,
    quantity,
    setQuantity,

    propertyType,
    setPropertyType,
    urgency,
    setUrgency,

    hasImages,
    setHasImages,
    requestFiles,
    setRequestFiles,

    intention,
    setIntention,

    contactName,
    setContactName,
    contactSurname,
    setContactSurname,
    contactPhone,
    setContactPhone,
    contactEmail,
    setContactEmail,

    privacyAccepted,
    setPrivacyAccepted,
    otp,
    setOtp,
  }
}

export type RequestFormState = ReturnType<typeof useRequestFormState>