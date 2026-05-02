import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@fixpro/db'
import { auth } from '@/lib/auth'
import { deleteStoredAsset } from '@/lib/uploadthing-server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ imageId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { imageId } = await params

  const image = await prisma.companyPortfolioImage.findUnique({
    where: { id: imageId },
    select: {
      id: true,
      storageKey: true,
      company: {
        select: {
          userId: true,
        },
      },
    },
  })

  if (!image || image.company.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.companyPortfolioImage.delete({
    where: { id: image.id },
  })

  if (image.storageKey) {
    await deleteStoredAsset(image.storageKey)
  }

  return NextResponse.json({ ok: true })
}
