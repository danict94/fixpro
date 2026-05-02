import type { PrismaClient } from '@prisma/client'
import type { ShowcasePlanSeed } from './seed-types'

export async function seedShowcasePlans(
  prisma: PrismaClient,
  showcasePlans: ShowcasePlanSeed[],
): Promise<void> {
  console.log('Avvio seed piani vetrina...')

  for (const plan of showcasePlans) {
    await prisma.showcasePlan.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan,
    })

    console.log(
      `  ✓ Vetrina ${plan.tier}: €${(plan.monthlyPriceCents / 100).toFixed(2)}/mese`,
    )
  }

  console.log('Seed piani vetrina completato.')
}