import { createRequire } from 'node:module'

const requireModule = createRequire(import.meta.url)

const createTwilioClient = requireModule('twilio') as (
  accountSid: string,
  authToken: string,
) => {
  messages: {
    create(args: {
      from: string
      to: string
      contentSid: string
      contentVariables: string
    }): Promise<unknown>
  }
}

export interface WhatsAppNotificationInput {
  to: string
  requestTitle: string
  city: string
  link: string
}

function normalizePhoneToE164(phone: string) {
  const compact = phone.replace(/[\s\-().]/g, '')
  if (!compact) return null
  if (compact.startsWith('+')) return compact
  if (compact.startsWith('00')) return `+${compact.slice(2)}`
  if (/^\d+$/.test(compact)) return `+${compact}`
  return null
}

function getTwilioClient() {
  return createTwilioClient(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
  )
}

export async function sendWhatsAppNotification({
  to,
  requestTitle,
  city,
  link,
}: WhatsAppNotificationInput) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const contentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID

    if (
      !accountSid ||
      !authToken ||
      !contentSid
    ) {
      console.error('[whatsapp] Missing Twilio WhatsApp configuration:', {
        hasAccountSid: Boolean(accountSid),
        hasAuthToken: Boolean(authToken),
        hasContentSid: Boolean(contentSid),
      })
      return
    }

    const normalizedPhone = normalizePhoneToE164(to)
    if (!normalizedPhone) {
      console.error('[whatsapp] Invalid phone number format:', to)
      return
    }

    const client = getTwilioClient()
    await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${normalizedPhone}`,
      contentSid,
      contentVariables: JSON.stringify({
        '1': requestTitle,
        '2': city,
        '3': link,
      }),
    })
  } catch (error) {
    console.error('[whatsapp] Failed to send WhatsApp notification:', {
      to,
      error,
    })
  }
}
