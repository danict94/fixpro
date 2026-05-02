import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { Prisma } from '@fixpro/db'

// createInputBase usato anche da createFromGuest via .extend() — non aggiungere .superRefine() qui
export const createInputBase = z.object({
  interventoId: z.string().min(1).optional(),
  categoriaId: z.string().min(1).optional(),
  servizioId: z.string().optional(),
  workType: z.enum(['SMALL', 'FULL', 'UNKNOWN']).optional(),
  description: z.string().min(20, 'Descrivi meglio il lavoro (min 20 caratteri)').max(2000),

  cap: z.string().max(10).optional(),
  address: z.string().optional(),
  streetNumber: z.string().optional(),
  city: z.string().optional(),
  province: z.string().max(2).optional().transform((value) => value?.toUpperCase()),
  lat: z.number().optional(),
  lng: z.number().optional(),

  propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL']).optional(),
  urgency: z.enum([
    'WITHIN_1_MONTH',
    'WITHIN_3_MONTHS',
    'WITHIN_6_MONTHS',
    'NO_PREFERENCE',
  ]).optional(),
  hasImages: z.boolean().default(false),
  intention: z.enum(['YES', 'MAYBE', 'INFO_ONLY']).optional(),

  contactName: z.string().min(1, 'Il nome è obbligatorio').max(100),
  contactSurname: z.string().min(1, 'Il cognome è obbligatorio').max(100),
  contactPhone: z.string().min(6).max(20).optional(),
  contactEmail: z.string().email('Email non valida').optional(),

  targetCompanyId: z.string().optional(),
})

export const createInput = createInputBase.superRefine((data, ctx) => {
  if (!data.interventoId && !data.categoriaId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Seleziona almeno un intervento valido',
      path: ['interventoId'],
    })
  }

  if (!data.targetCompanyId && !data.province && data.lat === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Seleziona la provincia per trovare professionisti nella tua zona',
      path: ['province'],
    })
  }
})

type CreateRequestData = z.infer<typeof createInputBase> & {
  privacyConsentAt?: Date
  privacyConsentVersion?: string
}

export async function buildAndCreateRequest(
  tx: Prisma.TransactionClient,
  clientId: string,
  input: CreateRequestData,
) {
  const requestedInterventoId = input.interventoId?.trim() || null
  const requestedCategoriaId = input.categoriaId?.trim() || null

  const servizio = input.servizioId
    ? await tx.servizio.findUnique({
        where: { id: input.servizioId },
        select: { nome: true, categoriaId: true },
      })
    : null

  let resolvedCategoriaId = requestedCategoriaId

  if (requestedInterventoId) {
    const matchingCategorie = await tx.matchingInterventoCat.findMany({
      where: {
        interventoId: requestedInterventoId,
        attivo: true,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { priorita: 'asc' },
      ],
      select: {
        categoriaId: true,
      },
    })

    if (matchingCategorie.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: "L'intervento selezionato non ha categorie compatibili attive",
      })
    }

    const preferredCategoria =
      (requestedCategoriaId
        ? matchingCategorie.find((matching) => matching.categoriaId === requestedCategoriaId)
        : null) ??
      (servizio
        ? matchingCategorie.find((matching) => matching.categoriaId === servizio.categoriaId)
        : null) ??
      matchingCategorie[0]

    resolvedCategoriaId = preferredCategoria?.categoriaId ?? null
  }

  if (!resolvedCategoriaId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Seleziona un intervento valido o una categoria compatibile',
    })
  }

  const categoria = await tx.categoria.findUniqueOrThrow({
    where: { id: resolvedCategoriaId },
    select: { nome: true },
  })

  if (servizio && servizio.categoriaId !== resolvedCategoriaId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: "Il servizio selezionato non appartiene alla categoria derivata dall'intervento",
    })
  }

  if (requestedInterventoId && servizio) {
    const matchingServizio = await tx.matchingInterventoServizio.findUnique({
      where: {
        interventoId_servizioId: {
          interventoId: requestedInterventoId,
          servizioId: input.servizioId!,
        },
      },
      select: { attivo: true },
    })

    if (!matchingServizio?.attivo) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: "Il servizio selezionato non e' compatibile con l'intervento scelto",
      })
    }
  }

  const title = servizio ? `${categoria.nome} — ${servizio.nome}` : categoria.nome

  return tx.serviceRequest.create({
    data: {
      clientId,
      categoriaId: resolvedCategoriaId,
      servizioId: input.servizioId ?? null,
      interventoId: requestedInterventoId,
      workType: input.workType ?? 'UNKNOWN',
      title,
      description: input.description.trim(),
      cap: input.cap ?? null,
      address: input.address?.trim() ?? null,
      streetNumber: input.streetNumber?.trim() ?? null,
      city: input.city?.trim() ?? null,
      province: input.province?.trim().toUpperCase() ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      propertyType: input.propertyType ?? null,
      urgency: input.urgency ?? null,
      hasImages: input.hasImages,
      intention: input.intention ?? null,
      contactName: input.contactName?.trim() ?? null,
      contactSurname: input.contactSurname?.trim() ?? null,
      contactPhone: input.contactPhone?.trim() ?? null,
      contactEmail: input.contactEmail?.trim() ?? null,
      targetCompanyId: input.targetCompanyId ?? null,
      privacyConsentAt: input.privacyConsentAt ?? null,
      privacyConsentVersion: input.privacyConsentVersion ?? null,
      status: 'PENDING',
    },
  })
}