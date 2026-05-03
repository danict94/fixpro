'use client'

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { Building2, Home } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  StepIndicator,
  TypeCard,
  cn,
} from '@fixpro/ui'
import { authClient } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc/client'
import { buildCategoriaIndex } from './profession-suggestions'
import { Step1Form } from './step-1-form'
import { MAX_ONBOARDING_CATEGORIES, OTP_COOLDOWN, STEPS } from './wizard-constants'
import type { RegistrazioneWizardProps, Role, SelectedCategoria } from './wizard-types'
import { hasValidCoordinates, normalizePhone, normalizeProvince } from './wizard-utils'

export function RegistrazioneWizard({ settori }: RegistrazioneWizardProps) {
  const [roleSelected, setRoleSelected] = useState(false)
  const [role, setRole] = useState<Role>('CLIENT')
  const [step, setStep] = useState(0)

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
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TypeCard
            icon={Home}
            title="Sono un cliente"
            subtitle="Cerco professionisti per i miei lavori"
            onClick={() => handleSelectRole('CLIENT')}
            className="surface-card rounded-[22px] border-0 p-7 text-left shadow-none"
            titleClassName="text-secondary"
            descriptionClassName="muted-copy text-sm"
          />

          <TypeCard
            icon={Building2}
            title="Sono un'professionista"
            subtitle="Dico di cosa mi occupo e completo i servizi dopo il primo accesso"
            onClick={() => handleSelectRole('COMPANY')}
            className="surface-card rounded-[22px] border-0 p-7 text-left shadow-none"
            titleClassName="text-secondary"
            descriptionClassName="muted-copy text-sm"
          />
        </div>

        <p className="muted-copy text-center text-sm">
          Hai già un account?{' '}
          <Link href="/accedi" className="text-primary font-semibold hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    )
  }

  return (
    <Card className="surface-card overflow-hidden border-0 shadow-none">
      <CardHeader className="space-y-5 px-6 pt-6 pb-3 sm:px-8">
        <button
          type="button"
          onClick={() => setRoleSelected(false)}
          className="secondary-link w-fit text-sm"
          aria-label="Cambia tipo account"
        >
          {'<-'} Indietro
        </button>

        <div className="space-y-2 text-center">
          <CardTitle className="text-secondary text-2xl font-semibold sm:text-[30px]">
            {role === 'CLIENT' ? 'Registrati come cliente' : 'Registrati come impresa'}
          </CardTitle>

          <p className="muted-copy mx-auto max-w-[620px] text-sm leading-6">
            {role === 'CLIENT'
              ? "Completa i dati, verifica il telefono e attiva l'account."
              : "Pochi dati ora: categoria professionale e zona. I servizi specifici li completi dopo l'accesso."}
          </p>
        </div>

        <div className="surface-card border-0 px-4 py-4 shadow-none">
          <StepIndicator steps={STEPS} current={step} />
        </div>
      </CardHeader>

      <CardContent className="px-6 pt-4 pb-6 sm:px-8 sm:pb-8">
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
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="text-secondary text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

interface Step2Props {
  telefono: string
  otp: string
  onOtp: (v: string) => void
  error: string | null
  loading: boolean
  cooldown: number
  otpSent: boolean
  onSendOtp: () => Promise<boolean>
  onSubmit: (event: FormEvent) => void
}

function Step2Otp({
  telefono,
  otp,
  onOtp,
  error,
  loading,
  cooldown,
  otpSent,
  onSendOtp,
  onSubmit,
}: Step2Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="feature-panel px-6 py-8 text-center sm:px-8">
        <p className="text-primary text-[12px] font-semibold tracking-[0.12em] uppercase">
          Verifica telefono
        </p>

        <p className="muted-copy mt-3 text-sm leading-6">
          Abbiamo inviato un codice di verifica al numero
        </p>

        <p className="text-secondary mt-1 text-base font-semibold">{telefono}</p>
      </div>

      <div className="surface-card px-5 py-6 sm:px-6">
        <Field label="Codice OTP" htmlFor="otp">
          <Input
            id="otp"
            value={otp}
            onChange={(event) => onOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="rounded-full text-center text-lg tracking-[0.35em]"
          />
        </Field>

        {error && (
          <div className="border-danger/20 bg-danger/10 mt-4 rounded-[18px] border px-4 py-3">
            <p className="text-danger text-sm font-medium" role="alert">
              {error}
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="primary-pill mt-5 w-full px-5 py-3"
          disabled={loading || otp.length < 6}
        >
          {loading ? 'Verifica in corso...' : 'Verifica codice'}
        </Button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onSendOtp}
            disabled={cooldown > 0}
            className="text-primary disabled:text-muted-foreground text-sm font-semibold hover:underline disabled:cursor-not-allowed disabled:no-underline"
          >
            {cooldown > 0
              ? `Reinvia codice (${cooldown}s)`
              : otpSent
                ? 'Non hai ricevuto il codice? Reinvia'
                : 'Invia codice'}
          </button>
        </div>
      </div>
    </form>
  )
}

interface Step3Props {
  email: string
  onResend: () => Promise<void>
}

function Step3EmailSent({ email, onResend }: Step3Props) {
  const [resent, setResent] = useState(false)

  async function handleResend() {
    await onResend()
    setResent(true)
  }

  return (
    <div className="space-y-5 py-2 text-center">
      <div className="feature-panel px-6 py-10 sm:px-8">
        <div className="ring-border/60 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>

        <h2 className="text-secondary mt-4 text-lg font-semibold">Controlla la tua email</h2>

        <p className="muted-copy mt-2 text-sm">Abbiamo inviato un link di attivazione a</p>

        <p className="text-secondary mt-1 font-medium">{email}</p>

        <p className="muted-copy mt-2 text-sm leading-6">
          Clicca il link nell&apos;email per attivare il tuo account.
        </p>
      </div>

      <div className="surface-card px-5 py-5 sm:px-6">
        <div className="space-y-3">
          <Link href="/accedi" className="block">
            <Button className="primary-pill w-full px-5 py-3">Vai al login</Button>
          </Link>

          <button
            type="button"
            onClick={handleResend}
            disabled={resent}
            className="text-primary disabled:text-muted-foreground w-full text-sm font-semibold hover:underline disabled:cursor-not-allowed disabled:no-underline"
          >
            {resent ? 'Email reinviata' : "Non hai ricevuto l'email? Reinvia"}
          </button>
        </div>
      </div>
    </div>
  )
}
