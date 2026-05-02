'use client'

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { Building2, Check, Home, Search, X } from 'lucide-react'
import {
  AddressAutocomplete,
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

type Role = 'CLIENT' | 'COMPANY'

interface ServizioOption {
  id: string
  nome: string
}

interface CategoriaOption {
  id: string
  nome: string
  slug: string
  descrizione?: string | null
  alias?: string[]
  searchTerms?: string[]
  servizi: ServizioOption[]
}

interface SettoreOption {
  id: string
  nome: string
  slug?: string
  categorie: CategoriaOption[]
}

type SelectedCategoria = CategoriaOption & {
  settoreId: string
  settoreNome: string
}

type ProfessionSuggestion = SelectedCategoria & {
  score: number
  reason: string
  preview: string[]
}

export interface RegistrazioneWizardProps {
  settori: SettoreOption[]
}

const STEPS = ['Dati', 'Verifica telefono', 'Email inviata']
const OTP_COOLDOWN = 60
const MAX_ONBOARDING_CATEGORIES = 2

const POPULAR_CATEGORY_SLUGS = [
  'impresa-edile',
  'muratore',
  'idraulico',
  'elettricista',
  'termoidraulico',
  'imbianchino',
  'fabbro',
  'geometra',
  'architetto',
  'traslocatore',
]

const QUERY_SYNONYMS: Record<string, string[]> = {
  bagno: ['bagno', 'sanitari', 'doccia', 'piastrelle bagno', 'ristrutturazione bagno'],
  bagni: ['bagno', 'sanitari', 'doccia', 'piastrelle bagno', 'ristrutturazione bagno'],
  caldaia: ['caldaia', 'termoidraulico', 'riscaldamento'],
  caldaie: ['caldaia', 'termoidraulico', 'riscaldamento'],
  condizionatore: ['climatizzatore', 'condizionatore', 'aria condizionata'],
  clima: ['climatizzatore', 'condizionatore', 'aria condizionata'],
  facciata: ['facciata', 'intonaci', 'cappotto', 'rasatura facciata'],
  facciate: ['facciata', 'intonaci', 'cappotto', 'rasatura facciata'],
  cappotto: ['cappotto termico', 'isolamento facciata', 'coibentazione'],
  serratura: ['serratura', 'fabbro', 'porta'],
  serrature: ['serratura', 'fabbro', 'porta'],
  infissi: ['infissi', 'finestre', 'serramenti', 'vetro'],
  serramenti: ['infissi', 'finestre', 'serramenti', 'vetro'],
  trasloco: ['trasloco', 'traslocatore', 'sgombero'],
  traslochi: ['trasloco', 'traslocatore', 'sgombero'],
}

function normalizePhone(raw: string): string {
  const n = raw.replace(/[\s\-().]/g, '')
  if (n.startsWith('+')) return n
  if (n.startsWith('0039')) return '+39' + n.slice(4)
  if (n.startsWith('39') && n.length >= 11) return '+' + n
  return '+39' + n
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function buildCategoriaIndex(settori: SettoreOption[]): SelectedCategoria[] {
  return settori.flatMap((settore) =>
    settore.categorie.map((categoria) => ({
      ...categoria,
      settoreId: settore.id,
      settoreNome: settore.nome,
    })),
  )
}

function getSuggestionReason(categoria: SelectedCategoria): string {
  if (categoria.alias?.length) return categoria.alias.slice(0, 3).join(', ')
  if (categoria.searchTerms?.length) return categoria.searchTerms.slice(0, 3).join(', ')
  if (categoria.descrizione) return categoria.descrizione
  return categoria.servizi.slice(0, 3).map((servizio) => servizio.nome).join(', ')
}

function buildSuggestions({
  query,
  categories,
  selectedIds,
}: {
  query: string
  categories: SelectedCategoria[]
  selectedIds: string[]
}): ProfessionSuggestion[] {
  const q = normalizeSearchText(query)

  if (!q) {
    return categories
      .map((categoria) => ({
        ...categoria,
        score: POPULAR_CATEGORY_SLUGS.includes(categoria.slug)
          ? 100 - POPULAR_CATEGORY_SLUGS.indexOf(categoria.slug)
          : selectedIds.includes(categoria.id)
            ? 80
            : 0,
        reason: getSuggestionReason(categoria),
        preview: categoria.servizi.slice(0, 4).map((servizio) => servizio.nome),
      }))
      .filter((categoria) => categoria.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
  }

  const terms = unique([q, ...(QUERY_SYNONYMS[q] ?? []).map(normalizeSearchText)])

  return categories
    .map((categoria) => {
      const name = normalizeSearchText(categoria.nome)
      const slug = normalizeSearchText(categoria.slug)
      const settore = normalizeSearchText(categoria.settoreNome)
      const aliases = (categoria.alias ?? []).map(normalizeSearchText)
      const searchTerms = (categoria.searchTerms ?? []).map(normalizeSearchText)
      const servizi = categoria.servizi.map((servizio) => normalizeSearchText(servizio.nome))

      let score = 0

      for (const term of terms) {
        if (name === term || slug === term) score += 120
        if (name.includes(term) || term.includes(name)) score += 90
        if (aliases.some((alias) => alias === term || alias.includes(term) || term.includes(alias))) score += 80
        if (searchTerms.some((searchTerm) => searchTerm.includes(term) || term.includes(searchTerm))) score += 70
        if (servizi.some((servizio) => servizio.includes(term) || term.includes(servizio))) score += 58
        if (settore.includes(term)) score += 25
      }

      if (selectedIds.includes(categoria.id)) score += 20

      return {
        ...categoria,
        score,
        reason: getSuggestionReason(categoria),
        preview: categoria.servizi.slice(0, 4).map((servizio) => servizio.nome),
      }
    })
    .filter((categoria) => categoria.score > 0)
    .sort((a, b) => b.score - a.score || a.nome.localeCompare(b.nome))
    .slice(0, 8)
}

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
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const allCategories = useMemo(() => buildCategoriaIndex(settori), [settori])

  const selectedCategories = useMemo(() => {
    const map = new Map(allCategories.map((categoria) => [categoria.id, categoria]))
    return categoriaIds
      .map((id) => map.get(id))
      .filter((categoria): categoria is SelectedCategoria => Boolean(categoria))
  }, [allCategories, categoriaIds])

  function handleSelectRole(nextRole: Role) {
    setRole(nextRole)
    setRoleSelected(true)
  }

  function handleToggleCategory(categoriaId: string) {
    setStep1Error(null)

    setCategoriaIds((current) => {
      if (current.includes(categoriaId)) return current.filter((id) => id !== categoriaId)

      if (current.length >= MAX_ONBOARDING_CATEGORIES) {
        setStep1Error('Puoi selezionare al massimo 2 categorie in questa fase.')
        return current
      }

      return [...current, categoriaId]
    })
  }

  async function handleStep1Submit(e: FormEvent) {
    e.preventDefault()
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

      if (hasMapsAutocomplete && (lat === null || lng === null)) {
        setStep1Error('Seleziona una località dai suggerimenti per attivare il matching geografico.')
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
      const msg = signUpResult.error.message ?? ''
      if (msg.toLowerCase().includes('email')) {
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
    if (otpSentOk) setStep(1)
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

  async function handleOtpVerify(e: FormEvent) {
    e.preventDefault()
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
          <Link href="/accedi" className="font-semibold text-primary hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    )
  }

  return (
    <Card className="surface-card overflow-hidden border-0 shadow-none">
      <CardHeader className="space-y-5 px-6 pb-3 pt-6 sm:px-8">
        <button
          type="button"
          onClick={() => setRoleSelected(false)}
          className="secondary-link w-fit text-sm"
          aria-label="Cambia tipo account"
        >
          {'<-'} Indietro
        </button>

        <div className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold text-secondary sm:text-[30px]">
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

      <CardContent className="px-6 pb-6 pt-4 sm:px-8 sm:pb-8">
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
              setCity(result.city)
              setProvince(result.province)
              setLat(result.lat)
              setLng(result.lng)
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
                callbackURL: role === 'COMPANY' ? '/area-impresa/dashboard' : '/area-cliente/richieste',
              })
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}

interface Step1Props {
  role: Role
  allCategories: SelectedCategoria[]
  selectedCategories: SelectedCategoria[]
  categoriaIds: string[]
  city: string
  radiusKm: number
  mapsApiKey: string
  onToggleCategory: (categoriaId: string) => void
  nome: string
  onNome: (v: string) => void
  cognome: string
  onCognome: (v: string) => void
  email: string
  onEmail: (v: string) => void
  telefono: string
  onTelefono: (v: string) => void
  password: string
  onPassword: (v: string) => void
  confermaPassword: string
  onConfermaPassword: (v: string) => void
  ragioneSociale: string
  onRagioneSociale: (v: string) => void
  partitaIva: string
  onPartitaIva: (v: string) => void
  onCity: (value: string) => void
  onRadiusKm: (value: number) => void
  onAddressSelect: (result: import('@fixpro/ui').AddressResult) => void
  error: string | null
  loading: boolean
  onSubmit: (e: FormEvent) => void
}

function Step1Form({
  role,
  allCategories,
  selectedCategories,
  categoriaIds,
  city,
  radiusKm,
  mapsApiKey,
  onToggleCategory,
  nome,
  onNome,
  cognome,
  onCognome,
  email,
  onEmail,
  telefono,
  onTelefono,
  password,
  onPassword,
  confermaPassword,
  onConfermaPassword,
  ragioneSociale,
  onRagioneSociale,
  partitaIva,
  onPartitaIva,
  onCity,
  onRadiusKm,
  onAddressSelect,
  error,
  loading,
  onSubmit,
}: Step1Props) {
  const [professionQuery, setProfessionQuery] = useState('')
  const [professionFocused, setProfessionFocused] = useState(false)

  const showSuggestions = role === 'COMPANY' && (professionFocused || professionQuery.trim().length > 0)

  const suggestions = useMemo(
    () =>
      buildSuggestions({
        query: professionQuery,
        categories: allCategories,
        selectedIds: categoriaIds,
      }),
    [allCategories, categoriaIds, professionQuery],
  )

  const companyReady =
    role !== 'COMPANY' ||
    (ragioneSociale.trim().length > 1 &&
      /^\d{11}$/.test(partitaIva) &&
      categoriaIds.length > 0 &&
      city.trim().length > 0)

  function handleSuggestionClick(categoriaId: string) {
    onToggleCategory(categoriaId)
    if (categoriaIds.length + 1 >= MAX_ONBOARDING_CATEGORIES && !categoriaIds.includes(categoriaId)) {
      setProfessionFocused(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <section className="rounded-[24px] border border-border bg-card p-4 sm:p-5">
        <SectionHeader
          title="Account"
          description="Dati essenziali per creare e verificare il profilo."
          stepLabel="1"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nome" htmlFor="nome">
            <Input
              id="nome"
              value={nome}
              onChange={(e) => onNome(e.target.value)}
              required
              placeholder="Mario"
              className="h-10 rounded-full"
            />
          </Field>

          <Field label="Cognome" htmlFor="cognome">
            <Input
              id="cognome"
              value={cognome}
              onChange={(e) => onCognome(e.target.value)}
              required
              placeholder="Rossi"
              className="h-10 rounded-full"
            />
          </Field>

          <Field label="Email" htmlFor="email" className="sm:col-span-2">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => onEmail(e.target.value)}
              required
              placeholder="mario@esempio.it"
              autoComplete="email"
              className="h-10 rounded-full"
            />
          </Field>

          <Field label="Telefono" htmlFor="telefono" className="sm:col-span-2">
            <Input
              id="telefono"
              type="tel"
              value={telefono}
              onChange={(e) => onTelefono(e.target.value)}
              required
              placeholder="333 1234567"
              autoComplete="tel"
              className="h-10 rounded-full"
            />
            <p className="muted-copy text-xs">
              {telefono.replace(/[\s\-().]/g, '').length >= 4 ? (
                <>
                  Verrà usato:{' '}
                  <span className="font-medium text-secondary">{normalizePhone(telefono)}</span>
                </>
              ) : (
                'Puoi inserire il numero con o senza prefisso.'
              )}
            </p>
          </Field>
        </div>
      </section>

      {role === 'COMPANY' && (
        <section className="rounded-[24px] border border-border bg-card p-4 sm:p-5">
          <SectionHeader
            title="Impresa"
            description="Dati minimi per creare il profilo e ricevere richieste nella zona corretta."
            stepLabel="2"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Ragione sociale" htmlFor="ragioneSociale">
              <Input
                id="ragioneSociale"
                value={ragioneSociale}
                onChange={(e) => onRagioneSociale(e.target.value)}
                required
                placeholder="Rossi Impianti S.r.l."
                className="h-10 rounded-full"
              />
            </Field>

            <Field label="Partita IVA" htmlFor="partitaIva">
              <Input
                id="partitaIva"
                value={partitaIva}
                onChange={(e) => onPartitaIva(e.target.value.replace(/\D/g, '').slice(0, 11))}
                required
                placeholder="12345678901"
                maxLength={11}
                inputMode="numeric"
                className="h-10 rounded-full"
              />
            </Field>

            <Field label="Zona di lavoro" className="sm:col-span-2">
              {mapsApiKey ? (
                <AddressAutocomplete
                  id="work-area"
                  apiKey={mapsApiKey}
                  placeholder="Cerca città o indirizzo operativo"
                  onAddressChange={onAddressSelect}
                />
              ) : (
                <Input
                  value={city}
                  onChange={(e) => onCity(e.target.value)}
                  placeholder="Inserisci la tua città operativa"
                  className="h-10 rounded-full"
                />
              )}
              <p className="muted-copy text-xs">
                {city ? `Riceverai richieste a partire da ${city}.` : 'Scegli la località operativa.'}
              </p>
            </Field>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-secondary">Raggio di copertura</label>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {radiusKm} km
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={radiusKm}
                onChange={(e) => onRadiusKm(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </section>
      )}

      {role === 'COMPANY' && (
        <section className="rounded-[24px] border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-secondary">Di cosa ti occupi?</h3>
              <p className="muted-copy mt-1 text-sm">
                Scrivi un mestiere o i lavori che fai. I servizi specifici li completi dopo il primo accesso.
              </p>
            </div>
            <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {categoriaIds.length}/{MAX_ONBOARDING_CATEGORIES} categorie
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={professionQuery}
              onFocus={() => setProfessionFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setProfessionFocused(false), 140)
              }}
              onChange={(e) => setProfessionQuery(e.target.value)}
              placeholder="Es. muratore, caldaie, bagni, infissi, traslochi..."
              className="h-11 rounded-full pl-10 pr-10"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls="profession-suggestions"
              aria-autocomplete="list"
            />
            {professionQuery && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setProfessionQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary"
                aria-label="Pulisci ricerca"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {showSuggestions && (
              <div
                id="profession-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[360px] overflow-y-auto rounded-[20px] border border-border bg-background p-2 shadow-xl"
              >
                <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {professionQuery.trim() ? 'Suggerimenti' : 'Professioni più cercate'}
                </p>

                {suggestions.length > 0 ? (
                  <div className="space-y-1.5">
                    {suggestions.map((categoria) => {
                      const selected = categoriaIds.includes(categoria.id)
                      const disabled = !selected && categoriaIds.length >= MAX_ONBOARDING_CATEGORIES

                      return (
                        <button
                          key={categoria.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          disabled={disabled}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSuggestionClick(categoria.id)}
                          className={cn(
                            'flex w-full items-start gap-3 rounded-[16px] px-3 py-3 text-left transition-colors',
                            selected ? 'bg-primary/10' : 'hover:bg-primary/5',
                            disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                              selected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground/30 bg-card',
                            )}
                          >
                            {selected && <Check className="h-3.5 w-3.5" />}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-secondary">{categoria.nome}</span>
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                {categoria.settoreNome}
                              </span>
                            </span>
                            <span className="mt-1 block line-clamp-1 text-xs text-muted-foreground">
                              {categoria.reason}
                            </span>
                            {categoria.preview.length > 0 && (
                              <span className="mt-2 flex flex-wrap gap-1.5">
                                {categoria.preview.slice(0, 3).map((servizio) => (
                                  <span
                                    key={servizio}
                                    className="rounded-full bg-muted/70 px-2 py-0.5 text-[11px] text-muted-foreground"
                                  >
                                    {servizio}
                                  </span>
                                ))}
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-[16px] border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Nessun suggerimento trovato. Prova con un mestiere o un lavoro diverso.
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedCategories.length > 0 && (
            <div className="mt-4 rounded-[18px] bg-muted/60 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categorie scelte
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((categoria) => (
                  <button
                    key={categoria.id}
                    type="button"
                    onClick={() => onToggleCategory(categoria.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1 text-xs font-medium text-secondary ring-1 ring-border hover:bg-muted"
                  >
                    {categoria.nome}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="rounded-[24px] border border-border bg-card p-4 sm:p-5">
        <SectionHeader
          title="Sicurezza"
          description="Crea una password sicura per completare la registrazione."
          stepLabel={role === 'COMPANY' ? '3' : '2'}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => onPassword(e.target.value)}
              required
              placeholder="Minimo 8 caratteri"
              autoComplete="new-password"
              className="h-10 rounded-full"
            />
          </Field>

          <Field label="Conferma password" htmlFor="confermaPassword">
            <Input
              id="confermaPassword"
              type="password"
              value={confermaPassword}
              onChange={(e) => onConfermaPassword(e.target.value)}
              required
              placeholder="Ripeti la password"
              autoComplete="new-password"
              className="h-10 rounded-full"
            />
          </Field>
        </div>
      </section>

      {error && (
        <div className="rounded-[18px] border border-danger/20 bg-danger/10 px-4 py-3">
          <p className="text-sm font-medium text-danger" role="alert">
            {error}
          </p>
        </div>
      )}

      <div className="sticky bottom-4 z-10 rounded-[24px] border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
        <Button type="submit" className="primary-pill w-full px-5 py-3" disabled={loading || !companyReady}>
          {loading ? 'Registrazione in corso...' : 'Continua'}
        </Button>
      </div>
    </form>
  )
}

function SectionHeader({
  title,
  description,
  stepLabel,
}: {
  title: string
  description: string
  stepLabel: string
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-secondary">{title}</h3>
        <p className="muted-copy mt-1 text-sm">{description}</p>
      </div>
      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        {stepLabel}
      </span>
    </div>
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
      <label htmlFor={htmlFor} className="text-sm font-medium text-secondary">
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
  onSubmit: (e: FormEvent) => void
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
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
          Verifica telefono
        </p>
        <p className="muted-copy mt-3 text-sm leading-6">Abbiamo inviato un codice di verifica al numero</p>
        <p className="mt-1 text-base font-semibold text-secondary">{telefono}</p>
      </div>

      <div className="surface-card px-5 py-6 sm:px-6">
        <Field label="Codice OTP" htmlFor="otp">
          <Input
            id="otp"
            value={otp}
            onChange={(e) => onOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="rounded-full text-center text-lg tracking-[0.35em]"
          />
        </Field>

        {error && (
          <div className="mt-4 rounded-[18px] border border-danger/20 bg-danger/10 px-4 py-3">
            <p className="text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          </div>
        )}

        <Button type="submit" className="primary-pill mt-5 w-full px-5 py-3" disabled={loading || otp.length < 6}>
          {loading ? 'Verifica in corso...' : 'Verifica codice'}
        </Button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onSendOtp}
            disabled={cooldown > 0}
            className="text-sm font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-primary"
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
        <h2 className="mt-4 text-lg font-semibold text-secondary">Controlla la tua email</h2>
        <p className="muted-copy mt-2 text-sm">Abbiamo inviato un link di attivazione a</p>
        <p className="mt-1 font-medium text-secondary">{email}</p>
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
            className="w-full text-sm font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          >
            {resent ? 'Email reinviata' : "Non hai ricevuto l'email? Reinvia"}
          </button>
        </div>
      </div>
    </div>
  )
}
