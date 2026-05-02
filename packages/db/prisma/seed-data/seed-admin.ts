import type { PrismaClient } from '@prisma/client'

export async function seedInitialAdmin(prisma: PrismaClient): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()

  if (!adminEmail) {
    console.warn('ADMIN_EMAIL non presente — admin non creato')
    return
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      adminRole: 'SUPER_ADMIN',
      emailVerified: true,
    },
    create: {
      name: adminEmail.split('@')[0] || 'Admin',
      email: adminEmail,
      emailVerified: true,
      role: 'CLIENT',
      adminRole: 'SUPER_ADMIN',
    },
  })

  console.log(
    `Admin iniziale pronto: ${adminEmail}. Password gestita tramite Better Auth/reset.`,
  )
}