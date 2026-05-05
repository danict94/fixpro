import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { Prisma } from '@fixpro/db'
import { getActivePublicShowcaseTargetById } from './public-showcase-company'

// createInputBase usato anche da createFromGuest via .extend().
// Regola funnel: l'intervento è l'unità obbligatoria della richiesta.
// Categoria e servizio sono contesto, non possono sostituire l'intervento.
export const createInputBase = z.object({
  interventoId: z.string().trim().min(1, 'Seleziona un intervento valido'),
  categoriaId: z.string().trim().min(1).optional(),
  servizioId: z.string().trim().min(1).optional(),
  workType: z.enum(['SMALL', 'FULL', 'UNKNOWN']).optional(),
  description: z.string().min(20, 'Descrivi meglio il lavoro (min 20 caratteri)').max(2000),

  cap: z.string().max(10).optional(),
  address: z.string().optional(),
  streetNumber: z.string().optional(),
  city: z.string().optional(),
  province: z
    .string()
    .max(2)
    .optional()
    .transform((value) => value?.toUpperCase()),
  lat: z.number().optional(),
  lng: z.number().optional(),

  propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL']).optional(),
  urgency: z
    .enum(['WITHIN_1_MONTH', 'WITHIN_3_MONTHS', 'WITHIN_6_MONTHS', 'NO_PREFERENCE'])
    .optional(),
  hasImages: z.boolean().default(false),
  intention: z.enum(['YES', 'MAYBE', 'INFO_ONLY']).optional(),

  contactName: z.string().min(1, 'Il nome è obbligatorio').max(100),
  contactSurname: z.string().min(1, 'Il cognome è obbligatorio').max(100),
  contactPhone: z.string().min(6).max(20).optional(),
  contactEmail: z.string().email('Email non valida').optional(),

  targetCompanyId: z.string().optional(),
})

export const createInput = createInputBase.superRefine((data, ctx) => {
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

type MatchingCategoriaResult = {
  categoriaId: string
}

type ServizioResult = {
  nome: string
  categoriaId: string
}

type InterventoResult = {
  id: string
  nome: string
}

export async function buildAndCreateRequest(
  tx: Prisma.TransactionClient,
  clientId: string,
  input: CreateRequestData,
) {
  const requestedInterventoId = input.interventoId.trim()
  const requestedCategoriaId = input.categoriaId?.trim() || null
  const requestedServizioId = input.servizioId?.trim() || null
  const requestedTargetCompanyId = input.targetCompanyId?.trim() || null

  const activeTargetCompany = requestedTargetCompanyId
    ? await getActivePublicShowcaseTargetById(tx, requestedTargetCompanyId)
    : null

  const safeTargetCompanyId = activeTargetCompany?.id ?? null

  if (requestedTargetCompanyId && !safeTargetCompanyId && !input.province && input.lat === undefined) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'La vetrina selezionata non è disponibile. Seleziona una zona per inviare la richiesta al marketplace.',
    })
  }

  const intervento = (await tx.intervento.findUnique({
    where: { id: requestedInterventoId },
    select: { id: true, nome: true },
  })) as InterventoResult | null

  if (!intervento) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: "L'intervento selezionato non esiste",
    })
  }

  const servizio = requestedServizioId
    ? ((await tx.servizio.findUnique({
        where: { id: requestedServizioId },
        select: { nome: true, categoriaId: true },
      })) as ServizioResult | null)
    : null

  if (requestedServizioId && !servizio) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Il servizio selezionato non esiste',
    })
  }

  const matchingCategorie = (await tx.matchingInterventoCat.findMany({
    where: {
      interventoId: requestedInterventoId,
      attivo: true,
    },
    orderBy: [{ isPrimary: 'desc' }, { priorita: 'asc' }],
    select: {
      categoriaId: true,
    },
  })) as MatchingCategoriaResult[]

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

  const resolvedCategoriaId = preferredCategoria?.categoriaId ?? null

  if (!resolvedCategoriaId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: "Non riusciamo a collegare l'intervento a una categoria compatibile",
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

  if (servizio && requestedServizioId) {
    const matchingServizio = await tx.matchingInterventoServizio.findUnique({
      where: {
        interventoId_servizioId: {
          interventoId: requestedInterventoId,
          servizioId: requestedServizioId,
        },
      },
      select: { attivo: true },
    })

    if (!matchingServizio?.attivo) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: "Il servizio selezionato non è compatibile con l'intervento scelto",
      })
    }
  }

  const title = servizio
    ? `${intervento.nome} — ${servizio.nome}`
    : intervento.nome || categoria.nome

  return tx.serviceRequest.create({
    data: {
      clientId,
      categoriaId: resolvedCategoriaId,
      servizioId: requestedServizioId,
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
      contactName: input.contactName.trim(),
      contactSurname: input.contactSurname.trim(),
      contactPhone: input.contactPhone?.trim() ?? null,
      contactEmail: input.contactEmail?.trim() ?? null,
      targetCompanyId: safeTargetCompanyId,
      privacyConsentAt: input.privacyConsentAt ?? null,
      privacyConsentVersion: input.privacyConsentVersion ?? null,
      status: 'PENDING',
    },
  })
}