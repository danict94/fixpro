'use client'

import Link from 'next/link'
import type { ElementType } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Sparkles } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@fixpro/ui'

import {
  ICONS_GUEST,
  ICONS_LOGGED,
  STEPS_GUEST,
  STEPS_LOGGED,
  WORK_TYPE_OPTIONS,
} from './wizard/constants'

import {
  getDimensionModeForIntervento,
  getMeasurementTypeForDimensionMode,
} from './wizard/dimensions'

import { normalizeComparisonText } from './wizard/intervento-search'

import { SuccessScreen } from './wizard/success-screen'
import { StepContacts } from './wizard/step-contacts'
import { StepDetails } from './wizard/step-details'
import { StepGuestAccount } from './wizard/step-guest-account'
import { StepImages } from './wizard/step-images'
import { StepIntention } from './wizard/step-intention'
import { StepLocation } from './wizard/step-location'
import { StepOtp } from './wizard/step-otp'
import { StepProject } from './wizard/step-project'

import { useRequestFormState } from './wizard/use-request-form-state'
import { useRequestPrefill } from './wizard/use-request-prefill'
import { useRequestSubmit } from './wizard/use-request-submit'
import { useRequestTaxonomy } from './wizard/use-request-taxonomy'

import type { DimensionMode, NuovaRichiestaWizardProps } from './wizard/types'

export function NuovaRichiestaWizard({
  settori,
  interventi,
  isGuest = false,
  initialUser,
  targetCompany,
  initialInterventoId,
  initialCategoriaId,
  initialServizioId,
}: NuovaRichiestaWizardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const steps = isGuest ? STEPS_GUEST : STEPS_LOGGED
  const stepIcons = isGuest ? ICONS_GUEST : ICONS_LOGGED
  const selectedMacroSlug = searchParams.get('macro')?.trim().toLowerCase() ?? ''

  const form = useRequestFormState({
    initialUser,
    initialInterventoId,
    initialCategoriaId,
    initialServizioId,
  })

  const taxonomy = useRequestTaxonomy({
    settori,
    interventi,
    selectedMacroSlug,
    interventoId: form.interventoId,
    categoriaId: form.categoriaId,
    searchQuery: form.searchQuery,
  })

  const prefill = useRequestPrefill({
    settori,
    interventi,
    initialInterventoId,
    servizioId: form.servizioId,
    setSearchQuery: form.setSearchQuery,
    setCategoriaId: form.setCategoriaId,
  })

  const resolvedCategoriaId =
    taxonomy.categoriaDerivata?.id ?? prefill.selectedServizio?.categoriaId ?? form.categoriaId

  const submit = useRequestSubmit({
    isGuest,
    targetCompany,
    form,
    categoriaId: resolvedCategoriaId,
    dimensionMode: taxonomy.dimensionMode,
    stepsLength: steps.length,
  })

  function goBack() {
    form.clearMessages()
    form.setStep((current) => Math.max(0, current - 1))
  }

  function resetDimensionsForMode(nextDimensionMode: DimensionMode) {
    if (nextDimensionMode === 'none') {
      form.setSurfaceMq('')
      form.setQuantity('')
    }

    if (nextDimensionMode === 'surface') {
      form.setQuantity('')
    }

    form.setMeasurementType((currentMeasurementType) =>
      getMeasurementTypeForDimensionMode({
        currentMeasurementType,
        nextDimensionMode,
      }),
    )
  }

  function handleSearchChange(nextValue: string) {
    form.setSearchQuery(nextValue)
    form.clearMessages()

    if (
      taxonomy.selectedIntervento &&
      normalizeComparisonText(nextValue) !==
        normalizeComparisonText(taxonomy.selectedIntervento.nome)
    ) {
      form.setInterventoId('')
      resetDimensionsForMode('none')
    }

    if (form.servizioId) {
      form.setServizioId('')
      form.setCategoriaId('')
      resetDimensionsForMode('none')
    }
  }

  function handleSelectIntervento(nextInterventoId: string) {
    const intervento =
      taxonomy.filteredInterventi.find((item) => item.id === nextInterventoId) ?? null

    form.setInterventoId(nextInterventoId)
    form.setServizioId('')
    form.setSearchQuery(intervento?.nome ?? '')
    resetDimensionsForMode(getDimensionModeForIntervento(intervento?.slug))
    form.clearMessages()
  }

  function handleSelectServizio(nextServizioId: string) {
    const servizio = taxonomy.serviziDisponibili.find((item) => item.id === nextServizioId) ?? null

    if (!servizio) {
      return
    }

    form.setServizioId(servizio.id)
    form.setCategoriaId(servizio.categoriaId)
    form.setInterventoId('')
    form.setSearchQuery(servizio.nome)
    resetDimensionsForMode('none')
    form.clearMessages()
  }

  if (submit.loggedSuccess) {
    return (
      <SuccessScreen
        description={
          <>
            La tua richiesta è stata inviata ai professionisti della tua zona. Ti contatteremo non
            appena qualcuno risponde. Puoi tenere d&apos;occhio lo stato dal tuo profilo.
          </>
        }
        notice={submit.postSubmitNotice}
        actions={
          <button
            type="button"
            onClick={() => {
              router.push('/area-cliente/richieste')
              router.refresh()
            }}
            className="primary-pill px-5 py-3 text-sm font-semibold"
          >
            Vai alle mie richieste
          </button>
        }
      />
    )
  }

  if (submit.guestSuccess && submit.guestNeedsLogin) {
    return (
      <SuccessScreen
        description={
          <>
            La tua richiesta è stata salvata. Hai già un account FixPro:{' '}
            <Link href="/accedi" className="text-primary underline">
              accedi
            </Link>{' '}
            per visualizzarla.
          </>
        }
        notice={submit.postSubmitNotice}
      />
    )
  }

  if (submit.guestSuccess && submit.guestNeedsEmailVerification) {
    return (
      <SuccessScreen
        description={
          <>
            La tua richiesta è stata salvata. Ti abbiamo inviato un link di accesso: aprilo per
            confermare la tua email e visualizzare la richiesta.
          </>
        }
        notice={submit.postSubmitNotice}
        actions={
          <Link href="/accedi" className="primary-pill px-5 py-3 text-sm font-semibold">
            Vai al login
          </Link>
        }
      />
    )
  }

  if (submit.guestSuccess) {
    return (
      <SuccessScreen
        description={<>La tua richiesta è stata salvata.</>}
        notice={submit.postSubmitNotice}
      />
    )
  }

  const StepIcon = (stepIcons[form.step] ?? Sparkles) as ElementType

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="feature-panel px-6 py-8 sm:px-8">
        <h1 className="section-title text-secondary">
          {isGuest ? 'Invia una richiesta' : 'Nuova richiesta'}
        </h1>
        <p className="muted-copy mt-3 text-sm leading-6 sm:text-[15px]">
          {isGuest
            ? 'Descrivi il lavoro e ricevi i contatti dei professionisti. Nessun obbligo.'
            : 'Descrivi il lavoro e ricevi i contatti delle imprese adatte.'}
        </p>
      </section>

      {targetCompany && (
        <div className="surface-section flex items-start gap-3 px-5 py-4">
          <Sparkles className="stroke-primary mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
          <div>
            <p className="text-secondary text-sm font-medium">
              Richiesta diretta a{' '}
              <span className="text-primary">{targetCompany.ragioneSociale}</span>
            </p>
            <p className="muted-copy mt-0.5 text-xs leading-5">
              La richiesta sarà inviata direttamente a {targetCompany.ragioneSociale}. Solo questo
              professionista potrà vederla e risponderti.
            </p>
          </div>
        </div>
      )}

      <Card className="surface-card border-0 shadow-none">
        <CardHeader className="space-y-5 px-6 pt-6 pb-3 sm:px-8">
          {form.step > 0 && (
            <button type="button" onClick={goBack} className="secondary-link w-fit text-sm">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Indietro
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <StepIcon className="stroke-primary h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold">{steps[form.step]}</p>
              <p className="muted-copy text-xs">
                Step {form.step + 1} di {steps.length}
              </p>
            </div>
          </div>

          <div className="surface-card border-0 px-4 py-4 shadow-none">
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${((form.step + 1) / steps.length) * 100}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pt-4 pb-6 sm:px-8 sm:pb-8">
          {form.step === 0 && (
            <StepLocation
              mapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}
              cap={form.cap}
              setCap={form.setCap}
              city={form.city}
              setCity={form.setCity}
              address={form.address}
              setAddress={form.setAddress}
              streetNumber={form.streetNumber}
              setStreetNumber={form.setStreetNumber}
              province={form.province}
              setProvince={form.setProvince}
              setLat={form.setLat}
              setLng={form.setLng}
              error={form.error}
              onSubmit={submit.handleStep0}
            />
          )}

          {form.step === 1 && (
            <StepProject
              error={form.error}
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault()

                form.clearMessages()

                if (!form.interventoId) {
                  form.setError('Seleziona un tipo di intervento per continuare')
                  return
                }

                submit.handleStep1(e)
              }}
              coverageBanner={null}
              selectedIntervento={taxonomy.selectedIntervento}
              selectedServizioNome={prefill.selectedServizio?.nome ?? null}
              selectedCategoriaNome={
                taxonomy.categoriaDerivata?.nome ?? prefill.selectedServizio?.categoria.nome ?? null
              }
              suggestedInterventi={taxonomy.suggestedInterventi}
              suggestedServizi={taxonomy.suggestedServizi}
              popularInterventi={taxonomy.popularInterventi}
              selectedMacroGroupTitle={taxonomy.selectedMacroGroup?.title}
              searchQuery={
                taxonomy.selectedIntervento && !form.searchQuery.trim()
                  ? taxonomy.selectedIntervento.nome
                  : form.searchQuery
              }
              setSearchQuery={handleSearchChange}
              onSelectIntervento={handleSelectIntervento}
              onSelectServizio={handleSelectServizio}
              workType={form.workType}
              setWorkType={form.setWorkType}
              categorieCompatibili={taxonomy.categorieCompatibili}
              description={form.description}
              setDescription={form.setDescription}
              dimensionMode={taxonomy.dimensionMode}
              surfaceMq={form.surfaceMq}
              setSurfaceMq={form.setSurfaceMq}
              measurementType={form.measurementType}
              setMeasurementType={form.setMeasurementType}
              quantity={form.quantity}
              setQuantity={form.setQuantity}
              WORK_TYPE_OPTIONS={WORK_TYPE_OPTIONS}
            />
          )}

          {form.step === 2 && (
            <StepDetails
              error={form.error}
              onSubmit={submit.handleStep2}
              propertyType={form.propertyType}
              setPropertyType={form.setPropertyType}
              urgency={form.urgency}
              setUrgency={form.setUrgency}
            />
          )}

          {form.step === 3 && (
            <StepImages
              error={form.error}
              onSubmit={submit.handleStep3}
              hasImages={form.hasImages}
              setHasImages={form.setHasImages}
              requestFiles={form.requestFiles}
              setRequestFiles={form.setRequestFiles}
            />
          )}

          {form.step === 4 && (
            <StepIntention
              error={form.error}
              onSubmit={submit.handleStep4}
              intention={form.intention}
              setIntention={form.setIntention}
            />
          )}

          {form.step === 5 && (
            <StepContacts
              isGuest={isGuest}
              initialUser={initialUser}
              error={form.error}
              notice={form.notice}
              loading={submit.loading}
              isUploadingRequestImages={submit.isUploadingRequestImages}
              emailNotVerified={submit.emailNotVerified}
              resendingEmail={submit.resendingEmail}
              contactName={form.contactName}
              setContactName={form.setContactName}
              contactSurname={form.contactSurname}
              setContactSurname={form.setContactSurname}
              contactPhone={form.contactPhone}
              setContactPhone={form.setContactPhone}
              contactEmail={form.contactEmail}
              setContactEmail={form.setContactEmail}
              onSubmit={submit.handleStep5}
              onResendVerificationEmail={submit.handleResendVerificationEmail}
            />
          )}

          {form.step === 6 && isGuest && (
            <StepGuestAccount
              error={form.error}
              loading={submit.loading}
              contactEmail={form.contactEmail}
              setContactEmail={form.setContactEmail}
              privacyAccepted={form.privacyAccepted}
              setPrivacyAccepted={form.setPrivacyAccepted}
              emailAlreadyRegistered={submit.emailAlreadyRegistered}
              setEmailAlreadyRegistered={submit.setEmailAlreadyRegistered}
              onSubmit={submit.handleSendOtp}
            />
          )}

          {form.step === 7 && isGuest && (
            <StepOtp
              error={form.error}
              loading={submit.loading}
              isUploadingRequestImages={submit.isUploadingRequestImages}
              otp={form.otp}
              setOtp={form.setOtp}
              otpCooldown={submit.otpCooldown}
              contactEmail={form.contactEmail}
              contactPhone={form.contactPhone}
              sentViaSms={submit.guestOtpSentViaSms}
              onSubmit={submit.handleVerifyOtp}
              onResendOtp={submit.handleResendOtp}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
