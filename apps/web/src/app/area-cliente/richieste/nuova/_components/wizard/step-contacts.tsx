'use client'

import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import { Button, Input } from '@fixpro/ui'

interface InitialUser {
  name: string
  surname: string
  email: string
  phone: string
}

interface StepContactsProps {
  isGuest: boolean
  initialUser?: InitialUser
  error: string | null
  notice: string | null
  loading: boolean
  isUploadingRequestImages: boolean
  emailNotVerified: boolean
  resendingEmail: boolean
  contactName: string
  setContactName: Dispatch<SetStateAction<string>>
  contactSurname: string
  setContactSurname: Dispatch<SetStateAction<string>>
  contactPhone: string
  setContactPhone: Dispatch<SetStateAction<string>>
  contactEmail: string
  setContactEmail: Dispatch<SetStateAction<string>>
  onSubmit: FormEventHandler<HTMLFormElement>
  onResendVerificationEmail: () => void | Promise<void>
}

export function StepContacts({
  isGuest,
  initialUser,
  error,
  notice,
  loading,
  isUploadingRequestImages,
  emailNotVerified,
  resendingEmail,
  contactName,
  setContactName,
  contactSurname,
  setContactSurname,
  contactPhone,
  setContactPhone,
  contactEmail,
  setContactEmail,
  onSubmit,
  onResendVerificationEmail,
}: StepContactsProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="surface-section space-y-5 px-5 py-5 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-secondary">
            {isGuest ? 'Come possiamo contattarti?' : 'Controlla i tuoi dati di contatto'}
          </p>
          <p className="muted-copy mt-1 text-sm">
            {isGuest
              ? 'I professionisti riceveranno i tuoi dati solo dopo aver acquistato la richiesta.'
              : 'Le imprese riceveranno i tuoi dati solo dopo aver acquistato la richiesta.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="contactName" className="text-sm font-medium text-secondary">Nome <span className="text-danger">*</span></label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Mario"
              required
              readOnly={!isGuest && !!initialUser}
              className={!isGuest && initialUser ? 'rounded-2xl border-border bg-muted cursor-default' : 'rounded-2xl border-border bg-white'}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="contactSurname" className="text-sm font-medium text-secondary">Cognome <span className="text-danger">*</span></label>
            <Input
              id="contactSurname"
              value={contactSurname}
              onChange={(e) => setContactSurname(e.target.value)}
              placeholder="Rossi"
              required
              readOnly={!isGuest && !!initialUser}
              className={!isGuest && initialUser ? 'rounded-2xl border-border bg-muted cursor-default' : 'rounded-2xl border-border bg-white'}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contactPhone" className="text-sm font-medium text-secondary">
            Telefono {isGuest && <span className="text-danger">*</span>}
          </label>
          <Input
            id="contactPhone"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+39 333 1234567"
            required={isGuest}
            readOnly={!isGuest && !!initialUser?.phone}
            className={!isGuest && initialUser?.phone ? 'rounded-2xl border-border bg-muted cursor-default' : 'rounded-2xl border-border bg-white'}
          />
          {isGuest && (
            <p className="muted-copy text-xs">
              Ti invieremo il codice di verifica via SMS a questo numero.
            </p>
          )}
        </div>

        {!isGuest && (
          <div className="space-y-1.5">
            <label htmlFor="contactEmail" className="text-sm font-medium text-secondary">Email</label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="mario@esempio.it"
              readOnly={!!initialUser?.email}
              className={initialUser?.email ? 'rounded-2xl border-border bg-muted cursor-default' : 'rounded-2xl border-border bg-white'}
            />
          </div>
        )}

        {!isGuest && initialUser && (
          <p className="muted-copy text-xs">
            I tuoi dati sono stati recuperati automaticamente dal tuo profilo.
          </p>
        )}

        {emailNotVerified ? (
          <div className="rounded-[18px] border border-warning/30 bg-warning/5 px-4 py-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-secondary">Verifica la tua email per continuare</p>
              <p className="muted-copy mt-0.5 text-sm">
                Abbiamo inviato un link di verifica alla tua email. Controllala e clicca il link per attivare il tuo account.
              </p>
            </div>
            <button
              type="button"
              onClick={onResendVerificationEmail}
              disabled={resendingEmail}
              className="primary-pill px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendingEmail ? 'Invio in corso...' : 'Reinvia email di verifica'}
            </button>
          </div>
        ) : error && (
          <p className="rounded-[18px] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">{error}</p>
        )}
        {notice && (
          <p className="rounded-[18px] border border-success/20 bg-success/5 px-4 py-3 text-sm text-success" role="status">
            {notice}
          </p>
        )}
      </div>

      <Button type="submit" className="primary-pill h-11 w-full text-sm font-semibold" disabled={loading || emailNotVerified}>
        {loading || isUploadingRequestImages ? 'Invio in corso...' : isGuest ? 'Continua' : 'Invia richiesta'}
      </Button>
    </form>
  )
}
