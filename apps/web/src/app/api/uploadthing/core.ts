import { z } from 'zod'
import { UploadThingError } from 'uploadthing/server'
import { createUploadthing, type FileRouter, UTFiles } from 'uploadthing/next'
import { prisma } from '@fixpro/db'
import { auth } from '@/lib/auth'
import {
  companyLogoStorageKey,
  companyPortfolioStorageKey,
  requestImageStorageKey,
} from '@/lib/asset-storage'

const f = createUploadthing()

const LOGO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
])

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

function ensureAllowedMime(files: readonly { type: string }[], allowedMimeTypes: Set<string>) {
  for (const file of files) {
    if (!allowedMimeTypes.has(file.type)) {
      throw new UploadThingError('Formato file non supportato.')
    }
  }
}

async function requireSession(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) {
    throw new UploadThingError('Autenticazione richiesta.')
  }

  if (!session.user.emailVerified || !(session.user as { phoneNumberVerified?: boolean }).phoneNumberVerified) {
    throw new UploadThingError('Completa la verifica email e telefono prima di caricare file.')
  }

  return session
}

export const uploadRouter = {
  companyLogoUploader: f(
    { image: { maxFileSize: '2MB', maxFileCount: 1 } },
    { awaitServerData: true },
  )
    .input(z.object({ companyId: z.string() }))
    .middleware(async ({ req, input, files }) => {
      const session = await requireSession(req)
      ensureAllowedMime(files, LOGO_MIME_TYPES)

      if ((session.user as { role?: string }).role !== 'COMPANY') {
        throw new UploadThingError('Solo le imprese possono caricare il logo.')
      }

      const company = await prisma.company.findFirst({
        where: {
          id: input.companyId,
          userId: session.user.id,
        },
        select: { id: true },
      })

      if (!company) {
        throw new UploadThingError('Impresa non autorizzata.')
      }

      return {
        companyId: company.id,
        [UTFiles]: files.map((file) => ({
          ...file,
          customId: companyLogoStorageKey(company.id, file.name),
        })),
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.company.update({
        where: { id: metadata.companyId },
        data: { logoUrl: file.url },
      })

      return { url: file.url }
    }),

  companyPortfolioUploader: f(
    { image: { maxFileSize: '4MB', maxFileCount: 10 } },
    { awaitServerData: true },
  )
    .input(z.object({ companyId: z.string() }))
    .middleware(async ({ req, input, files }) => {
      const session = await requireSession(req)
      ensureAllowedMime(files, IMAGE_MIME_TYPES)

      if ((session.user as { role?: string }).role !== 'COMPANY') {
        throw new UploadThingError('Solo le imprese possono caricare immagini portfolio.')
      }

      const company = await prisma.company.findFirst({
        where: {
          id: input.companyId,
          userId: session.user.id,
        },
        select: {
          id: true,
          showcase: {
            select: { status: true, expiresAt: true },
          },
          _count: {
            select: { portfolioImages: true },
          },
        },
      })

      if (!company) {
        throw new UploadThingError('Impresa non autorizzata.')
      }

      const hasActiveShowcase =
        company.showcase?.status === 'ACTIVE' &&
        company.showcase.expiresAt > new Date()

      if (!hasActiveShowcase) {
        throw new UploadThingError('Il portfolio richiede una Vetrina Premium attiva.')
      }

      if (company._count.portfolioImages + files.length > 10) {
        throw new UploadThingError('Massimo 10 immagini portfolio.')
      }

      return {
        companyId: company.id,
        [UTFiles]: files.map((file) => ({
          ...file,
          customId: companyPortfolioStorageKey(company.id, file.name),
        })),
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.companyPortfolioImage.create({
        data: {
          companyId: metadata.companyId,
          url: file.url,
          storageKey: file.customId ?? file.key,
        },
      })

      return { url: file.url }
    }),

  requestImageUploader: f(
    { image: { maxFileSize: '4MB', maxFileCount: 5 } },
    { awaitServerData: true, acl: 'private' },
  )
    .input(z.object({ requestId: z.string() }))
    .middleware(async ({ req, input, files }) => {
      const session = await requireSession(req)
      ensureAllowedMime(files, IMAGE_MIME_TYPES)

      if ((session.user as { role?: string }).role !== 'CLIENT') {
        throw new UploadThingError('Solo i clienti possono caricare immagini richiesta.')
      }

      const request = await prisma.serviceRequest.findFirst({
        where: {
          id: input.requestId,
          clientId: session.user.id,
        },
        select: {
          id: true,
          _count: {
            select: { images: true },
          },
        },
      })

      if (!request) {
        throw new UploadThingError('Richiesta non autorizzata.')
      }

      if (request._count.images + files.length > 5) {
        throw new UploadThingError('Massimo 5 immagini per richiesta.')
      }

      return {
        requestId: request.id,
        [UTFiles]: files.map((file) => ({
          ...file,
          customId: requestImageStorageKey(request.id, file.name),
        })),
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.$transaction([
        prisma.requestImage.create({
          data: {
            requestId: metadata.requestId,
            url: file.url,
            storageKey: file.customId ?? file.key,
          },
        }),
        prisma.serviceRequest.update({
          where: { id: metadata.requestId },
          data: { hasImages: true },
        }),
      ])

      return { url: file.url }
    }),
} satisfies FileRouter

export type AppFileRouter = typeof uploadRouter
