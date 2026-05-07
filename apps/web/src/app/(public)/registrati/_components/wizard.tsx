'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { authClient } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc/client'
import { buildCategoriaIndex } from './profession-suggestions'
import { RoleSelection } from './role-selection'
import { Step1Form } from './step-1-form'
import { Step2Otp } from './step-2-otp'
import { Step3EmailSent } from './step-3-email-sent'
import { MAX_ONBOARDING_CATEGORIES, OTP_COOLDOWN } from './wizard-constants'
import type { RegistrazioneWizardProps, Role, SelectedCategoria } from './wizard-types'
import { hasValidCoordinates, normalizePhone, normalizeProvince } from './wizard-utils'
import { WizardShell } from './wizard-shell'

export function RegistrazioneWizard({ settori }: RegistrazioneWizardProps) {
  const [roleSelected, setRoleSelected] = useState(false)
  const [role, setRole] = useState<Role>('CLIENT')
  const [step, setStep] = useState(0)
  const [formStep, setFormStep] = useState(0)

  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [confermaPassword, setConfermaPassword] = useState('')

  const [ragioneSociale, setRagioneSociale] = useState('')
  const [partitaIva, setPartitaIva] = useState('')
  const [categoriaIds, setCategoriaIds] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [radiusKm, setRadiusKm] = useState(30)

  const [step1Error, setStep1Error] = useState<string | null>(null)
  const [step1Loading, setStep1Loading] = useState(false)

  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const checkPartitaIva = trpc.company.checkPartitaIva.useMutation()
  const companyRegister = trpc.company.register.useMutation()
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const hasMapsAutocomplete = Boolean(mapsApiKey)

  useEffect(() => {
    if (cooldown <= 0) return

    const timer = window.setTimeout(() => {
      setCooldown((current) => current - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [cooldown])

  const allCategories = useMemo(() => buildCategoriaIndex(settori), [settori])

  const selectedCategories = useMemo(() => {
    const categoriesById = new Map(allCategories.map((categoria) => [categoria.id, categoria]))

    return categoriaIds
      .map((id) => categoriesById.get(id))
      .filter((categoria): categoria is SelectedCategoria => Boolean(categoria))
  }, [allCategories, categoriaIds])

  function handleSelectRole(nextRole: Role) {
    setRole(nextRole)
    setStep(0)
    setFormStep(0)
    setRoleSelected(true)
  }

  function handleToggleCategory(categoriaId: string) {
    setStep1Error(null)

    setCategoriaIds((current) => {
      if (current.includes(categoriaId)) {
        return current.filter((id) => id !== categoriaId)
      }

      if (current.length >= MAX_ONBOARDING_CATEGORIES) {
        setStep1Error('Puoi selezionare al massimo 2 categorie in questa fase.')
        return current
      }

      return [...current, categoriaId]
    })
  }

  async function handleStep1Submit(event: FormEvent) {
    event.preventDefault()
    setStep1Error(null)

    if (password !== confermaPassword) {
      setStep1Error('Le password non corrispondono.')
      return
    }

    if (password.length < 8) {
      setStep1Error('La password deve essere di almeno 8 caratteri.')
      return
    }

    const phoneE164 = normalizePhone(telefono)

    if (phoneE164.length < 8) {
      setStep1Error('Inserisci un numero di telefono valido.')
      return
    }

    if (role === 'COMPANY') {
      if (ragioneSociale.trim().length < 2) {
        setStep1Error('La ragione sociale è troppo corta.')
        return
      }

      if (!/^\d{11}$/.test(partitaIva)) {
        setStep1Error('La partita IVA deve essere di esattamente 11 cifre.')
        return
      }

      if (categoriaIds.length === 0) {
        setStep1Error('Scrivi di cosa ti occupi e seleziona almeno una categoria.')
        return
      }

      if (!city.trim()) {
        setStep1Error('Seleziona dove lavori per ricevere richieste nella tua zona.')
        return
      }

      if (hasMapsAutocomplete && !hasValidCoordinates(lat, lng)) {
        setStep1Error(
          'Seleziona una località dai suggerimenti per attivare il matching geografico.',
        )
        return
      }
    }

    setStep1Loading(true)

    if (role === 'COMPANY') {
      try {
        await checkPartitaIva.mutateAsync({ partitaIva: partitaIva.trim() })
      } catch (error) {
        setStep1Loading(false)
        setStep1Error(
          error instanceof Error
            ? error.message
            : 'Questa partita IVA è già associata a un profilo impresa.',
        )
        return
      }
    }

    const verificationCallbackURL =
      role === 'COMPANY' ? '/area-impresa/dashboard' : '/area-cliente/richieste'

    const signUpResult = await authClient.signUp.email({
      email,
      password,
      name: `${nome.trim()} ${cognome.trim()}`.trim(),
      phoneNumber: phoneE164,
      callbackURL: verificationCallbackURL,
    })

    if (signUpResult.error) {
      setStep1Loading(false)

      const message = signUpResult.error.message ?? ''

      if (message.toLowerCase().includes('email')) {
        setStep1Error('Questa email è già registrata. Prova ad accedere.')
      } else {
        setStep1Error('Registrazione non riuscita. Controlla i dati e riprova.')
      }

      return
    }

    if (role === 'COMPANY') {
      try {
        await companyRegister.mutateAsync({
          ragioneSociale: ragioneSociale.trim(),
          partitaIva: partitaIva.trim(),
          categoriaIds,
          servizioIds: [],
          city: city.trim() || undefined,
          province: province.trim() || undefined,
          lat: lat ?? undefined,
          lng: lng ?? undefined,
          radiusKm,
        })

        const sessionRefresh = await authClient.signIn.email({
          email,
          password,
        })

        if (sessionRefresh.error) {
          throw new Error('Profilo impresa creato, ma sessione non aggiornata. Accedi di nuovo.')
        }
      } catch (error) {
        setStep1Loading(false)
        console.error('[wizard] company.register failed - user was created', error)
        setStep1Error(
          error instanceof Error
            ? error.message
            : 'Profilo impresa non completato. Riprova oppure accedi e completa il profilo.',
        )
        return
      }
    }

    setStep1Loading(false)

    const otpSentOk = await sendOtp()

    if (otpSentOk) {
      setStep(1)
    }
  }

  async function sendOtp(): Promise<boolean> {
    setOtpError(null)

    const phoneE164 = normalizePhone(telefono)
    const result = await authClient.phoneNumber.sendOtp({ phoneNumber: phoneE164 })

    if (result.error) {
      setOtpError('Impossibile inviare il codice SMS. Controlla il numero e riprova.')
      return false
    }

    setOtpSent(true)
    setCooldown(OTP_COOLDOWN)
    return true
  }

  async function handleOtpVerify(event: FormEvent) {
    event.preventDefault()
    setOtpError(null)
    setOtpLoading(true)

    const result = await authClient.phoneNumber.verify({
      phoneNumber: normalizePhone(telefono),
      code: otp,
    })

    setOtpLoading(false)

    if (result.error) {
      setOtpError('Codice non valido o scaduto. Riprova.')
      return
    }

    setStep(2)
  }

  if (!roleSelected) {
    return <RoleSelection onSelectRole={handleSelectRole} />
  }

  return (
    <WizardShell role={role} step={step} formStep={formStep} onBack={() => setRoleSelected(false)}>
      {step === 0 && (
        <Step1Form
          role={role}
          allCategories={allCategories}
          selectedCategories={selectedCategories}
          categoriaIds={categoriaIds}
          city={city}
          radiusKm={radiusKm}
          mapsApiKey={mapsApiKey}
          onToggleCategory={handleToggleCategory}
          nome={nome}
          onNome={setNome}
          cognome={cognome}
          onCognome={setCognome}
          email={email}
          onEmail={setEmail}
          telefono={telefono}
          onTelefono={setTelefono}
          password={password}
          onPassword={setPassword}
          confermaPassword={confermaPassword}
          onConfermaPassword={setConfermaPassword}
          ragioneSociale={ragioneSociale}
          onRagioneSociale={setRagioneSociale}
          partitaIva={partitaIva}
          onPartitaIva={setPartitaIva}
          onCity={setCity}
          onRadiusKm={setRadiusKm}
          onAddressSelect={(result) => {
            if (result.city) {
              setCity(result.city)
            }

            if (result.province) {
              setProvince(normalizeProvince(result.province))
            }

            if (hasValidCoordinates(result.lat, result.lng)) {
              setLat(result.lat)
              setLng(result.lng)
            } else {
              setLat(null)
              setLng(null)
            }
          }}
          error={step1Error}
          loading={step1Loading}
          onSubmit={handleStep1Submit}
          onFormStepChange={setFormStep}
        />
      )}

      {step === 1 && (
        <Step2Otp
          telefono={telefono}
          otp={otp}
          onOtp={setOtp}
          error={otpError}
          loading={otpLoading}
          cooldown={cooldown}
          otpSent={otpSent}
          onSendOtp={sendOtp}
          onSubmit={handleOtpVerify}
        />
      )}

      {step === 2 && (
        <Step3EmailSent
          email={email}
          onResend={async () => {
            await authClient.sendVerificationEmail({
              email,
              callbackURL:
                role === 'COMPANY' ? '/area-impresa/dashboard' : '/area-cliente/richieste',
            })
          }}
        />
      )}
    </WizardShell>
  )
}

