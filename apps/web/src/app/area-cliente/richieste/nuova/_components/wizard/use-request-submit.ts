'use client'

import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useUploadThing } from '@/lib/uploadthing'
import { buildDescriptionWithDimensions } from './dimensions'
import type { RequestFormState } from './use-request-form-state'
import type { NuovaRichiestaWizardProps } from './types'

type TargetCompany = NuovaRichiestaWizardProps['targetCompany']

export function useRequestSubmit({
  isGuest,
  targetCompany,
  form,
  categoriaId,
  dimensionMode,
  stepsLength,
}: {
  isGuest: boolean
  targetCompany: TargetCompany
  form: RequestFormState
  categoriaId?: string
  dimensionMode: Parameters<typeof buildDescriptionWithDimensions>[0]['dimensionMode']
  stepsLength: number
}) {
  const [loading, setLoading] = useState(false)
  const [postSubmitNotice, setPostSubmitNotice] = useState<string | null>(null)

  const [otpCooldown, setOtpCooldown] = useState(0)
  const [emailAlreadyRegistered, setEmailAlreadyRegistered] = useState(false)
  const [guestOtpSentViaSms, setGuestOtpSentViaSms] = useState(false)

  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)

  const [loggedSuccess, setLoggedSuccess] = useState(false)
  const [guestSuccess, setGuestSuccess] = useState(false)
  const [guestNeedsLogin, setGuestNeedsLogin] = useState(false)
  const [guestNeedsEmailVerification, setGuestNeedsEmailVerification] = useState(false)

  const createRequest = trpc.requests.create.useMutation()
  const sendGuestOtp = trpc.requests.sendGuestOtp.useMutation()
  const createFromGuest = trpc.requests.createFromGuest.useMutation()
  const resendVerificationEmail = trpc.requests.resendVerificationEmail.useMutation()

  const { startUpload: startRequestImageUpload, isUploading: isUploadingRequestImages } =
    useUploadThing('requestImageUploader')

  useEffect(() => {
    if (otpCooldown <= 0) return

    const timer = setTimeout(() => {
      setOtpCooldown((current) => current - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [otpCooldown])

  function goNext() {
    form.clearMessages()
    form.setStep((current) => Math.min(stepsLength - 1, current + 1))
  }

  function buildBaseRequestPayload() {
    return {
      interventoId: form.interventoId || undefined,
      categoriaId: categoriaId || undefined,
      servizioId: form.servizioId || undefined,
      workType: form.workType,
      description: buildDescriptionWithDimensions({
        description: form.description,
        dimensionMode,
        surfaceMq: form.surfaceMq,
        measurementType: form.measurementType,
        quantity: form.quantity,
      }),
      cap: form.cap.trim() || undefined,
      address: form.address.trim() || undefined,
      streetNumber: form.streetNumber.trim() || undefined,
      city: form.city.trim() || undefined,
      province: form.province.trim() || undefined,
      lat: form.lat ?? undefined,
      lng: form.lng ?? undefined,
      propertyType: form.propertyType || undefined,
      urgency: form.urgency || undefined,
      hasImages: form.requestFiles.length > 0,
      intention: form.intention || undefined,
      contactName: form.contactName.trim(),
      contactSurname: form.contactSurname.trim(),
      contactPhone: form.contactPhone.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      targetCompanyId: targetCompany?.id ?? undefined,
    }
  }

  function handleStep0(e: React.FormEvent) {
    e.preventDefault()
    form.clearMessages()

    if (!form.city.trim()) {
      form.setError('La città è obbligatoria.')
      return
    }

    if (!form.lat && !form.province.trim()) {
      form.setError('Inserisci la provincia per trovare professionisti nella tua zona.')
      return
    }

    goNext()
  }

  function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    form.clearMessages()

    if (!form.interventoId && !form.servizioId) {
      form.setError('Seleziona un intervento dai suggerimenti per continuare.')
      return
    }

    if (!categoriaId) {
      form.setError('Non riusciamo ancora a collegare questo lavoro al professionista giusto.')
      return
    }

    if (form.description.trim().length < 20) {
      form.setError('Descrivi meglio il lavoro, almeno 20 caratteri.')
      return
    }

    goNext()
  }

  function handleStep2(e: React.FormEvent) {
    e.preventDefault()
    form.clearMessages()

    if (!form.propertyType) {
      form.setError('Seleziona il tipo di proprietà.')
      return
    }

    if (!form.urgency) {
      form.setError('Seleziona la data di inizio lavori.')
      return
    }

    goNext()
  }

  function handleStep3(e: React.FormEvent) {
    e.preventDefault()
    form.clearMessages()

    if (form.hasImages === null) {
      form.setError('Indica se hai immagini da allegare.')
      return
    }

    if (form.hasImages === true && form.requestFiles.length === 0) {
      form.setError('Se hai scelto di allegare immagini, seleziona almeno un file.')
      return
    }

    goNext()
  }

  function handleStep4(e: React.FormEvent) {
    e.preventDefault()
    form.clearMessages()

    if (!form.intention) {
      form.setError("Seleziona un'opzione.")
      return
    }

    goNext()
  }

  async function uploadRequestImages(requestId: string) {
    if (form.requestFiles.length === 0) return

    try {
      await startRequestImageUpload(form.requestFiles, { requestId })
    } catch {
      setPostSubmitNotice(
        'La richiesta è stata creata, ma non siamo riusciti a caricare tutte le immagini.',
      )
    }
  }

  async function handleStep5(e: React.FormEvent) {
    e.preventDefault()
    form.clearMessages()

    if (!form.contactName.trim()) {
      form.setError('Il nome è obbligatorio.')
      return
    }

    if (!form.contactSurname.trim()) {
      form.setError('Il cognome è obbligatorio.')
      return
    }

    if (isGuest) {
      goNext()
      return
    }

    setLoading(true)

    try {
      const request = await createRequest.mutateAsync(buildBaseRequestPayload())
      await uploadRequestImages(request.id)
      setLoggedSuccess(true)
    } catch (err: unknown) {
      const apiError = err as { data?: { code?: string }; message?: string }

      if (apiError.data?.code === 'FORBIDDEN') {
        form.setError('Verifica la tua email per continuare')
        setEmailNotVerified(true)
      } else {
        form.setError(apiError.message || 'Si è verificato un errore. Riprova.')
      }

      setLoading(false)
    }
  }

  async function handleResendVerificationEmail() {
    form.clearMessages()
    setResendingEmail(true)

    try {
      await resendVerificationEmail.mutateAsync()
      form.setNotice('Email di verifica inviata! Controlla la tua casella.')
      setEmailNotVerified(false)
    } catch {
      form.setError("Errore nell'invio dell'email. Riprova.")
    } finally {
      setResendingEmail(false)
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    form.clearMessages()
    setEmailAlreadyRegistered(false)

    if (!form.contactPhone.trim()) {
      form.setError("Il numero di telefono è obbligatorio per ricevere il codice via SMS.")
      return
    }

    if (!form.contactEmail.trim()) {
      form.setError("L'email è obbligatoria.")
      return
    }

    if (!form.privacyAccepted) {
      form.setError('Devi accettare la Privacy Policy per continuare.')
      return
    }

    setLoading(true)

    try {
      const otpResult = await sendGuestOtp.mutateAsync({
        email: form.contactEmail.toLowerCase().trim(),
        name: form.contactName.trim(),
        surname: form.contactSurname.trim(),
        phone: form.contactPhone.trim(),
      })

      setGuestOtpSentViaSms(Boolean(otpResult.sentSms))
      setOtpCooldown(60)
      goNext()
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? ''

      if (msg === 'EMAIL_REGISTRATA_CLIENT') {
        setEmailAlreadyRegistered(true)
      } else {
        form.setError(msg || "Errore nell'invio del codice. Riprova.")
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    form.clearMessages()

    if (form.otp.length !== 6) {
      form.setError('Inserisci il codice a 6 cifre.')
      return
    }

    if (!form.contactPhone.trim()) {
      form.setError("Il numero di telefono è obbligatorio per verificare il codice SMS.")
      return
    }

    setLoading(true)

    try {
      const result = await createFromGuest.mutateAsync({
        ...buildBaseRequestPayload(),
        contactEmail: form.contactEmail.toLowerCase().trim(),
        email: form.contactEmail.toLowerCase().trim(),
        name: form.contactName.trim(),
        surname: form.contactSurname.trim(),
        phone: form.contactPhone.trim(),
        otp: form.otp,
        privacyAccepted: true,
        privacyVersion: '2026-01-01',
      })

      const needsEmailVerification =
        'needsEmailVerification' in result && result.needsEmailVerification

      if (form.requestFiles.length > 0) {
        setPostSubmitNotice(
          needsEmailVerification
            ? 'La richiesta è stata creata. Apri il link ricevuto via email per entrare nel tuo account e gestire eventuali allegati.'
            : 'La richiesta è stata creata. Accedi per completare il caricamento delle immagini.',
        )
      }

      if (result.needsLogin) {
        setGuestNeedsLogin(true)
      } else {
        setGuestNeedsEmailVerification(Boolean(needsEmailVerification))
      }

      setGuestSuccess(true)
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      form.setError(msg ?? 'Codice non valido. Riprova.')
      setLoading(false)
    }
  }

  async function handleResendOtp() {
    form.clearMessages()

    if (!form.contactPhone.trim()) {
      form.setError("Il numero di telefono è obbligatorio per ricevere il codice via SMS.")
      return
    }

    setLoading(true)

    try {
      const otpResult = await sendGuestOtp.mutateAsync({
        email: form.contactEmail.toLowerCase().trim(),
        name: form.contactName.trim(),
        surname: form.contactSurname.trim(),
        phone: form.contactPhone.trim(),
      })

      setGuestOtpSentViaSms(Boolean(otpResult.sentSms))
      setOtpCooldown(60)
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      form.setError(msg ?? "Errore nell'invio del codice. Riprova.")
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    postSubmitNotice,

    otpCooldown,
    emailAlreadyRegistered,
    setEmailAlreadyRegistered,
    guestOtpSentViaSms,

    emailNotVerified,
    resendingEmail,

    loggedSuccess,
    guestSuccess,
    guestNeedsLogin,
    guestNeedsEmailVerification,

    buildBaseRequestPayload,

    handleStep0,
    handleStep1,
    handleStep2,
    handleStep3,
    handleStep4,
    handleStep5,

    handleResendVerificationEmail,
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,

    isUploadingRequestImages,
  }
}