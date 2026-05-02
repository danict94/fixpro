import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fixpro/db'
import { auth } from '@/lib/auth'
import {
  uploadAsset,
  companyLogoStorageKey,
  companyPortfolioStorageKey,
  requestImageStorageKey,
} from '@/lib/asset-storage'
import { requireVerifiedSessionResponse } from '@/lib/verified-session'

const uploaderSchema = z.enum([
  'companyLogoUploader',
  'companyPortfolioUploader',
  'requestImageUploader',
])

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

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function ensureAllowedFiles(
  files: File[],
  options: {
    maxFileCount: number
    maxFileSizeBytes: number
    allowedMimeTypes: Set<string>
  },
) {
  if (files.length === 0) {
    throw new Error('Seleziona almeno un file.')
  }

  if (files.length > options.maxFileCount) {
    throw new Error(`Puoi caricare al massimo ${options.maxFileCount} file.`)
  }

  for (const file of files) {
    if (!options.allowedMimeTypes.has(file.type)) {
      throw new Error('Formato file non supportato.')
    }
    if (file.size > options.maxFileSizeBytes) {
      throw new Error('Il file supera la dimensione massima consentita.')
    }
  }
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  const verificationError = requireVerifiedSessionResponse(session)
  if (verificationError) {
    return verificationError
  }
  const verifiedSession = session as NonNullable<typeof session>

  const formData = await req.formData()
  const uploader = uploaderSchema.safeParse(formData.get('uploader'))
  if (!uploader.success) {
    return jsonError('Uploader non valido.')
  }

  const files = formData
    .getAll('files')
    .filter((entry): entry is File => entry instanceof File)

  try {
    if (uploader.data === 'companyLogoUploader') {
      const companyId = z.string().parse(formData.get('companyId'))
      ensureAllowedFiles(files, {
        maxFileCount: 1,
        maxFileSizeBytes: 2 * 1024 * 1024,
        allowedMimeTypes: LOGO_MIME_TYPES,
      })
      const logoFile = files[0]

      if ((verifiedSession.user as { role?: string }).role !== 'COMPANY') {
        return jsonError('Solo le imprese possono caricare il logo.', 403)
      }

      const company = await prisma.company.findFirst({
        where: {
          id: companyId,
          userId: verifiedSession.user.id,
        },
        select: { id: true },
      })

      if (!company) {
        return jsonError('Impresa non autorizzata.', 403)
      }

      if (!logoFile) {
        return jsonError('Seleziona un file logo.')
      }

      const uploaded = await uploadAsset(logoFile, companyLogoStorageKey(company.id, logoFile.name))

      await prisma.company.update({
        where: { id: company.id },
        data: { logoUrl: uploaded.url },
      })

      return NextResponse.json({ files: [uploaded] })
    }

    if (uploader.data === 'companyPortfolioUploader') {
      const companyId = z.string().parse(formData.get('companyId'))
      ensureAllowedFiles(files, {
        maxFileCount: 10,
        maxFileSizeBytes: 4 * 1024 * 1024,
        allowedMimeTypes: IMAGE_MIME_TYPES,
      })

      if ((verifiedSession.user as { role?: string }).role !== 'COMPANY') {
        return jsonError('Solo le imprese possono caricare immagini portfolio.', 403)
      }

      const company = await prisma.company.findFirst({
        where: {
          id: companyId,
          userId: verifiedSession.user.id,
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
        return jsonError('Impresa non autorizzata.', 403)
      }

      const hasActiveShowcase =
        company.showcase?.status === 'ACTIVE' &&
        company.showcase.expiresAt > new Date()

      if (!hasActiveShowcase) {
        return jsonError('Il portfolio richiede una Vetrina Premium attiva.', 403)
      }

      if (company._count.portfolioImages + files.length > 10) {
        return jsonError('Massimo 10 immagini portfolio.', 400)
      }

      const uploadedFiles = await Promise.all(
        files.map((file) => uploadAsset(file, companyPortfolioStorageKey(company.id, file.name))),
      )

      await prisma.companyPortfolioImage.createMany({
        data: uploadedFiles.map((file) => ({
          companyId: company.id,
          url: file.url,
          storageKey: file.storageKey,
        })),
      })

      return NextResponse.json({ files: uploadedFiles })
    }

    const requestId = z.string().parse(formData.get('requestId'))
    ensureAllowedFiles(files, {
      maxFileCount: 5,
      maxFileSizeBytes: 4 * 1024 * 1024,
      allowedMimeTypes: IMAGE_MIME_TYPES,
    })

    if ((verifiedSession.user as { role?: string }).role !== 'CLIENT') {
      return jsonError('Solo i clienti possono caricare immagini richiesta.', 403)
    }

    const request = await prisma.serviceRequest.findFirst({
      where: {
        id: requestId,
        clientId: verifiedSession.user.id,
      },
      select: {
        id: true,
        _count: {
          select: { images: true },
        },
      },
    })

    if (!request) {
      return jsonError('Richiesta non autorizzata.', 403)
    }

    if (request._count.images + files.length > 5) {
      return jsonError('Massimo 5 immagini per richiesta.', 400)
    }

    const uploadedFiles = await Promise.all(
      files.map((file) => uploadAsset(file, requestImageStorageKey(request.id, file.name))),
    )

    await prisma.$transaction([
      prisma.requestImage.createMany({
        data: uploadedFiles.map((file) => ({
          requestId: request.id,
          url: file.url,
          storageKey: file.storageKey,
        })),
      }),
      prisma.serviceRequest.update({
        where: { id: request.id },
        data: { hasImages: true },
      }),
    ])

    return NextResponse.json({ files: uploadedFiles })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Upload non riuscito.')
  }
}
