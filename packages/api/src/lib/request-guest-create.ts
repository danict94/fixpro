import { TRPCError } from '@trpc/server'
import type { Prisma, PrismaClient } from '@fixpro/db'
import { buildAndCreateRequest } from './request-create'
import {
  normalizePhoneToE164,
  verifyGuestOtpSms,
  type GuestOtpPayload,
} from './request-guest-otp'

type SendMagicLink = (email: string, callbackURL?: string) => Promise<void>

type CreateRequestFromGuestInput = {
  db: PrismaClient
  input: {
    interventoId: string
    categoriaId?: string
    servizioId?: string
    workType?: 'SMALL' | 'FULL' | 'UNKNOWN'
    description: string
    cap?: string
    address?: string
    streetNumber?: string
    city?: string
    province?: string
    lat?: number
    lng?: number
    propertyType?: 'RESIDENTIAL' | 'COMMERCIAL'
    urgency?: 'WITHIN_1_MONTH' | 'WITHIN_3_MONTHS' | 'WITHIN_6_MONTHS' | 'NO_PREFERENCE'
    hasImages?: boolean
    intention?: 'YES' | 'MAYBE' | 'INFO_ONLY'
    targetCompanyId?: string
    email: string
    name: string
    surname: string
    phone: string
    otp: string
    privacyAccepted: true
    privacyVersion: string
  }
  sendMagicLink: SendMagicLink
}

export async function createRequestFromGuest({
  db,
  input,
  sendMagicLink,
}: CreateRequestFromGuestInput) {
  const email = input.email.toLowerCase().trim()
  const normalizedPhone = normalizePhoneToE164(input.phone.trim())

  if (!input.interventoId.trim()) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Seleziona un intervento valido per continuare.',
    })
  }

  if (!normalizedPhone) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Numero di telefono non valido. Richiedi un nuovo codice.',
    })
  }

  const identifier = `guest-otp:${normalizedPhone}`

  const record = await db.verification.findFirst({ where: { identifier } })

  if (!record || record.expiresAt < new Date()) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Codice scaduto o non trovato. Richiedi un nuovo codice.',
    })
  }

  const payload = JSON.parse(record.value) as GuestOtpPayload

  if (payload.phone !== normalizedPhone || payload.email !== email) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Dati non coerenti. Richiedi un nuovo codice.',
    })
  }

  const otpApproved = await verifyGuestOtpSms(normalizedPhone, input.otp)

  if (!otpApproved) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Codice non valido o scaduto. Richiedi un nuovo codice.',
    })
  }

  await db.verification.deleteMany({ where: { identifier } })

  const existingUser = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      phoneNumber: true,
      phoneNumberVerified: true,
    },
  })

  if (existingUser?.role === 'COMPANY') {
    throw new TRPCError({
      code: 'CONFLICT',
      message: 'Email associata a un account impresa.',
    })
  }

  const privacyConsentAt = new Date()
  const privacyConsentVersion = input.privacyVersion

  if (existingUser) {
    if (!existingUser.phoneNumberVerified || existingUser.phoneNumber !== normalizedPhone) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'EMAIL_REGISTRATA_CLIENT',
      })
    }

    const request = await db.$transaction((tx: Prisma.TransactionClient) =>
      buildAndCreateRequest(tx, existingUser.id, {
        ...input,
        interventoId: input.interventoId.trim(),
        categoriaId: input.categoriaId?.trim() || undefined,
        servizioId: input.servizioId?.trim() || undefined,
        hasImages: false,
        contactName: input.name.trim(),
        contactSurname: input.surname.trim(),
        contactPhone: input.phone.trim(),
        contactEmail: email,
        privacyConsentAt,
        privacyConsentVersion,
      }),
    )

    try {
      await sendMagicLink(email, '/area-cliente/richieste')
    } catch (emailErr: unknown) {
      await db.serviceRequest.delete({ where: { id: request.id } }).catch((compErr: unknown) => {
        console.error('[request-guest-create] Existing user request compensation failed:', compErr)
      })

      console.error('[request-guest-create] sendMagicLink failed:', emailErr)

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Impossibile inviare il link di accesso. Riprova.',
      })
    }

    return {
      ok: true,
      requestId: request.id,
      needsLogin: true,
      email,
    }
  }

  const created = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: {
        name: `${input.name.trim()} ${input.surname.trim()}`,
        email,
        emailVerified: false,
        role: 'CLIENT',
        phoneNumber: normalizedPhone,
        phoneNumberVerified: true,
      },
    })

    const request = await buildAndCreateRequest(tx, user.id, {
      ...input,
      interventoId: input.interventoId.trim(),
      categoriaId: input.categoriaId?.trim() || undefined,
      servizioId: input.servizioId?.trim() || undefined,
      hasImages: false,
      contactName: input.name.trim(),
      contactSurname: input.surname.trim(),
      contactPhone: input.phone.trim(),
      contactEmail: email,
      privacyConsentAt,
      privacyConsentVersion,
    })

    return {
      userId: user.id,
      requestId: request.id,
    }
  })

  try {
    await sendMagicLink(email, '/area-cliente/richieste')
  } catch (emailErr: unknown) {
    await db
      .$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.serviceRequest.delete({ where: { id: created.requestId } })
        await tx.user.delete({ where: { id: created.userId } })
      })
      .catch((compErr: unknown) => {
        console.error('[request-guest-create] Compensation failed:', compErr)
      })

    console.error('[request-guest-create] sendMagicLink failed:', emailErr)

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Impossibile inviare il link di accesso. Riprova.',
    })
  }

  return {
    ok: true,
    requestId: created.requestId,
    needsLogin: false,
    needsEmailVerification: true,
    email,
  }
}