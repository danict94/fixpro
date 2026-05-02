import { TRPCError } from '@trpc/server'
import twilio from 'twilio'

export interface GuestOtpPayload {
  sendCount: number
  email: string
  phone: string
}

function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
  )
}

export function normalizePhoneToE164(phone: string) {
  const compact = phone.replace(/[\s\-().]/g, '')

  if (!compact) return null
  if (compact.startsWith('+')) return compact
  if (compact.startsWith('00')) return `+${compact.slice(2)}`
  if (compact.startsWith('39') && compact.length >= 11) return `+${compact}`
  if (/^\d+$/.test(compact)) return `+39${compact}`

  return null
}

export async function sendGuestOtpSms(phone: string) {
  const normalizedPhone = normalizePhoneToE164(phone)

  if (!normalizedPhone) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Inserisci un numero di telefono valido per ricevere il codice via SMS.',
    })
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

  if (!accountSid || !authToken || !verifyServiceSid) {
    console.warn('[requests.sendGuestOtp] Missing Twilio SMS configuration', {
      hasAccountSid: Boolean(accountSid),
      hasAuthToken: Boolean(authToken),
      hasVerifyServiceSid: Boolean(verifyServiceSid),
    })

    return false
  }

  try {
    await getTwilioClient().verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: normalizedPhone,
        channel: 'sms',
      })

    return true
  } catch (error) {
    console.error('[requests.sendGuestOtp] SMS delivery failed:', {
      phone: normalizedPhone,
      error,
    })

    return false
  }
}

export async function verifyGuestOtpSms(phone: string, code: string) {
  const normalizedPhone = normalizePhoneToE164(phone)

  if (!normalizedPhone) {
    return false
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

  if (!accountSid || !authToken || !verifyServiceSid) {
    console.warn('[requests.createFromGuest] Missing Twilio SMS configuration', {
      hasAccountSid: Boolean(accountSid),
      hasAuthToken: Boolean(authToken),
      hasVerifyServiceSid: Boolean(verifyServiceSid),
    })

    return false
  }

  try {
    const check = await getTwilioClient().verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: normalizedPhone,
        code,
      })

    return check.status === 'approved'
  } catch (error) {
    console.error('[requests.createFromGuest] SMS verify failed:', {
      phone: normalizedPhone,
      error,
    })

    return false
  }
}