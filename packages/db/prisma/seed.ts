import { PrismaClient } from '@prisma/client'

import { showcasePlans } from './seed-data/showcase-plans-data'
import { interventiData, taxonomy } from './seed-data/taxonomy-data'
import { seedInitialAdmin } from './seed-data/seed-admin'
import { seedInterventiAndMatching, seedTaxonomy } from './seed-data/seed-taxonomy'
import { seedShowcasePlans } from './seed-data/seed-showcase-plans'
import { validateSeed } from './seed-data/taxonomy-validate'

const prisma = new PrismaClient()

const MIN_SETTORI = 5
const MIN_CATEGORIE = 20
const MIN_INTERVENTI = 50

function assertSeedIsNotAccidentallyPartial(): void {
  const settoriCount = taxonomy.length
  const categorieCount = taxonomy.reduce(
    (total, settore) => total + settore.categorie.length,
    0,
  )
  const interventiCount = interventiData.length

  if (settoriCount < MIN_SETTORI) {
    throw new Error(
      [
        'Seed taxonomy bloccato: numero settori troppo basso.',
        `Trovati: ${settoriCount}`,
        `Minimo richiesto: ${MIN_SETTORI}`,
        'Possibile taxonomy-data.ts vuoto/parziale. Seed interrotto per evitare soft-delete accidentali.',
      ].join('\n'),
    )
  }

  if (categorieCount < MIN_CATEGORIE) {
    throw new Error(
      [
        'Seed taxonomy bloccato: numero categorie troppo basso.',
        `Trovate: ${categorieCount}`,
        `Minimo richiesto: ${MIN_CATEGORIE}`,
        'Possibile taxonomy-data.ts vuoto/parziale. Seed interrotto per evitare soft-delete accidentali.',
      ].join('\n'),
    )
  }

  if (interventiCount < MIN_INTERVENTI) {
    throw new Error(
      [
        'Seed taxonomy bloccato: numero interventi troppo basso.',
        `Trovati: ${interventiCount}`,
        `Minimo richiesto: ${MIN_INTERVENTI}`,
        'Possibile interventiData vuoto/parziale. Seed interrotto per evitare soft-delete accidentali.',
      ].join('\n'),
    )
  }
}

async function main(): Promise<void> {
  assertSeedIsNotAccidentallyPartial()

  validateSeed({
    taxonomy,
    interventiData,
  })

  await seedTaxonomy(prisma, taxonomy)
  await seedShowcasePlans(prisma, showcasePlans)
  await seedInterventiAndMatching(prisma, interventiData)
  await seedInitialAdmin(prisma)

  console.log('Seed FixPro completato con successo.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())