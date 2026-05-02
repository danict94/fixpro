import type { PrismaClient } from '@prisma/client'
import type { InterventoSeed, SettoreSeed } from './seed-types'
import { servizioSlug } from './seed-utils'

export async function seedTaxonomy(
  prisma: PrismaClient,
  taxonomy: SettoreSeed[],
): Promise<void> {
  console.log('Avvio seed tassonomia FixPro...')

  const activeSettoreSlugs = taxonomy.map((settore) => settore.slug)

  const activeCategoriaSlugs = taxonomy.flatMap((settore) =>
    settore.categorie.map((categoria) => categoria.slug),
  )

  const activeServizioSlugs = taxonomy.flatMap((settore) =>
    settore.categorie.flatMap((categoria) =>
      categoria.servizi.map((servizio) => servizioSlug(categoria.slug, servizio)),
    ),
  )

  for (const settoreData of taxonomy) {
    const settore = await prisma.settore.upsert({
      where: { slug: settoreData.slug },
      update: {
        nome: settoreData.nome,
        descrizione: settoreData.descrizione,
        fase: settoreData.fase,
        ordine: settoreData.ordine,
        attivo: true,
      },
      create: {
        nome: settoreData.nome,
        slug: settoreData.slug,
        descrizione: settoreData.descrizione,
        fase: settoreData.fase,
        ordine: settoreData.ordine,
        attivo: true,
      },
    })

    for (const catData of settoreData.categorie) {
      const categoria = await prisma.categoria.upsert({
        where: { slug: catData.slug },
        update: {
          settoreId: settore.id,
          nome: catData.nome,
          descrizione: catData.descrizione,
          alias: catData.alias,
          searchTerms: catData.searchTerms,
          attivo: true,
        },
        create: {
          settoreId: settore.id,
          nome: catData.nome,
          slug: catData.slug,
          descrizione: catData.descrizione,
          alias: catData.alias,
          searchTerms: catData.searchTerms,
          attivo: true,
        },
      })

      for (const [ordine, servizioNome] of catData.servizi.entries()) {
        const slug = servizioSlug(catData.slug, servizioNome)

        await prisma.servizio.upsert({
          where: { slug },
          update: {
            categoriaId: categoria.id,
            nome: servizioNome,
            ordine,
            attivo: true,
          },
          create: {
            categoriaId: categoria.id,
            nome: servizioNome,
            slug,
            ordine,
            attivo: true,
          },
        })
      }
    }

    console.log(`  ✓ ${settoreData.nome}`)
  }

  await prisma.servizio.updateMany({
    where: { slug: { notIn: activeServizioSlugs } },
    data: { attivo: false },
  })

  await prisma.categoria.updateMany({
    where: { slug: { notIn: activeCategoriaSlugs } },
    data: { attivo: false },
  })

  await prisma.settore.updateMany({
    where: { slug: { notIn: activeSettoreSlugs } },
    data: { attivo: false },
  })

  await deactivateMatchingForInactiveTaxonomy(prisma)

  console.log('Seed tassonomia completato.')
}

export async function seedInterventiAndMatching(
  prisma: PrismaClient,
  interventiData: InterventoSeed[],
): Promise<void> {
  console.log('Avvio seed interventi e matching...')

  const activeInterventoSlugs = interventiData.map((intervento) => intervento.slug)

  await prisma.intervento.updateMany({
    where: { slug: { notIn: activeInterventoSlugs } },
    data: { attivo: false },
  })

  await deactivateMatchingForInactiveInterventi(prisma)

  const allCategorie = await prisma.categoria.findMany({
    select: { id: true, slug: true },
  })

  const catMap = new Map(
    allCategorie.map((categoria) => [categoria.slug, categoria.id]),
  )

  const allServizi = await prisma.servizio.findMany({
    select: { id: true, slug: true },
  })

  const servMap = new Map(
    allServizi.map((servizio) => [servizio.slug, servizio.id]),
  )

  for (const interventoData of interventiData) {
    const intervento = await prisma.intervento.upsert({
      where: { slug: interventoData.slug },
      update: {
        nome: interventoData.nome,
        descrizione: interventoData.descrizione,
        alias: interventoData.alias,
        searchTerms: interventoData.searchTerms,
        ordine: interventoData.ordine,
        attivo: true,
      },
      create: {
        nome: interventoData.nome,
        slug: interventoData.slug,
        descrizione: interventoData.descrizione,
        alias: interventoData.alias,
        searchTerms: interventoData.searchTerms,
        ordine: interventoData.ordine,
        attivo: true,
      },
    })

    const activeCategoriaIds: string[] = []

    for (const matchingCategoria of interventoData.categorie) {
      const categoriaId = catMap.get(matchingCategoria.slug)

      if (!categoriaId) {
        throw new Error(
          `Categoria '${matchingCategoria.slug}' non trovata per intervento '${interventoData.slug}'`,
        )
      }

      activeCategoriaIds.push(categoriaId)

      await prisma.matchingInterventoCat.upsert({
        where: {
          interventoId_categoriaId: {
            interventoId: intervento.id,
            categoriaId,
          },
        },
        update: {
          priorita: matchingCategoria.priorita,
          isPrimary: matchingCategoria.isPrimary,
          attivo: true,
        },
        create: {
          interventoId: intervento.id,
          categoriaId,
          priorita: matchingCategoria.priorita,
          isPrimary: matchingCategoria.isPrimary,
          attivo: true,
        },
      })
    }

    await prisma.matchingInterventoCat.updateMany({
      where: {
        interventoId: intervento.id,
        categoriaId: { notIn: activeCategoriaIds },
      },
      data: { attivo: false },
    })

    const activeServizioIds: string[] = []

    for (const matchingServizio of interventoData.servizi) {
      const slug = servizioSlug(matchingServizio.catSlug, matchingServizio.nome)
      const servizioId = servMap.get(slug)

      if (!servizioId) {
        throw new Error(
          `Servizio '${slug}' non trovato per intervento '${interventoData.slug}'`,
        )
      }

      activeServizioIds.push(servizioId)

      await prisma.matchingInterventoServizio.upsert({
        where: {
          interventoId_servizioId: {
            interventoId: intervento.id,
            servizioId,
          },
        },
        update: { attivo: true },
        create: {
          interventoId: intervento.id,
          servizioId,
          attivo: true,
        },
      })
    }

    await prisma.matchingInterventoServizio.updateMany({
      where: {
        interventoId: intervento.id,
        servizioId: { notIn: activeServizioIds },
      },
      data: { attivo: false },
    })

    console.log(`  ✓ Intervento: ${interventoData.nome}`)
  }

  console.log('Seed interventi e matching completato.')
}

async function deactivateMatchingForInactiveTaxonomy(
  prisma: PrismaClient,
): Promise<void> {
  const inactiveCategorie = await prisma.categoria.findMany({
    where: { attivo: false },
    select: { id: true },
  })

  const inactiveCategoriaIds = inactiveCategorie.map((categoria) => categoria.id)

  if (inactiveCategoriaIds.length > 0) {
    await prisma.matchingInterventoCat.updateMany({
      where: { categoriaId: { in: inactiveCategoriaIds } },
      data: { attivo: false },
    })
  }

  const inactiveServizi = await prisma.servizio.findMany({
    where: { attivo: false },
    select: { id: true },
  })

  const inactiveServizioIds = inactiveServizi.map((servizio) => servizio.id)

  if (inactiveServizioIds.length > 0) {
    await prisma.matchingInterventoServizio.updateMany({
      where: { servizioId: { in: inactiveServizioIds } },
      data: { attivo: false },
    })
  }
}

async function deactivateMatchingForInactiveInterventi(
  prisma: PrismaClient,
): Promise<void> {
  const inactiveInterventi = await prisma.intervento.findMany({
    where: { attivo: false },
    select: { id: true },
  })

  const inactiveInterventoIds = inactiveInterventi.map(
    (intervento) => intervento.id,
  )

  if (inactiveInterventoIds.length > 0) {
    await prisma.matchingInterventoCat.updateMany({
      where: { interventoId: { in: inactiveInterventoIds } },
      data: { attivo: false },
    })

    await prisma.matchingInterventoServizio.updateMany({
      where: { interventoId: { in: inactiveInterventoIds } },
      data: { attivo: false },
    })
  }
}