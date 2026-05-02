import type { InterventoSeed, SettoreSeed } from './seed-types'
import { assertOnePrimary, assertUnique, servizioSlug } from './seed-utils'

export function validateSeed({
  taxonomy,
  interventiData,
}: {
  taxonomy: SettoreSeed[]
  interventiData: InterventoSeed[]
}): void {
  assertUnique(
    taxonomy.map((settore) => settore.slug),
    'Slug settore',
  )

  assertUnique(
    taxonomy.map((settore) => String(settore.ordine)),
    'Ordine settore',
  )

  for (const settore of taxonomy) {
    if (settore.categorie.length === 0) {
      throw new Error(`Settore '${settore.slug}' senza categorie`)
    }

    assertUnique(
      settore.categorie.map((categoria) => categoria.slug),
      `Slug categoria duplicati nel settore '${settore.slug}'`,
    )
  }

  const categorie = taxonomy.flatMap((settore) => settore.categorie)

  assertUnique(
    categorie.map((categoria) => categoria.slug),
    'Slug categoria',
  )

  for (const categoria of categorie) {
    if (categoria.servizi.length === 0) {
      throw new Error(`Categoria '${categoria.slug}' senza servizi`)
    }

    assertUnique(
      categoria.servizi.map((servizio) => servizio.toLowerCase().trim()),
      `Servizi duplicati nella categoria '${categoria.slug}'`,
    )
  }

  const servizi = taxonomy.flatMap((settore) =>
    settore.categorie.flatMap((categoria) =>
      categoria.servizi.map((servizio) => ({
        slug: servizioSlug(categoria.slug, servizio),
        categoriaSlug: categoria.slug,
        nome: servizio,
      })),
    ),
  )

  assertUnique(
    servizi.map((servizio) => servizio.slug),
    'Slug servizio',
  )

  assertUnique(
    interventiData.map((intervento) => intervento.slug),
    'Slug intervento',
  )

  assertUnique(
    interventiData.map((intervento) => String(intervento.ordine)),
    'Ordine intervento',
  )

  const categoriaSlugSet = new Set(categorie.map((categoria) => categoria.slug))
  const servizioSlugSet = new Set(servizi.map((servizio) => servizio.slug))

  for (const intervento of interventiData) {
    if (intervento.categorie.length === 0) {
      throw new Error(`Intervento '${intervento.slug}' senza categorie compatibili`)
    }

    assertOnePrimary(intervento.slug, intervento.categorie)

    assertUnique(
      intervento.categorie.map((categoria) => categoria.slug),
      `Categorie duplicate in intervento '${intervento.slug}'`,
    )

    assertUnique(
      intervento.categorie.map((categoria) => String(categoria.priorita)),
      `Priorità categorie duplicate in intervento '${intervento.slug}'`,
    )

    assertUnique(
      intervento.servizi.map((servizio) =>
        servizioSlug(servizio.catSlug, servizio.nome),
      ),
      `Servizi duplicati in intervento '${intervento.slug}'`,
    )

    const matchedCategoriaSlugs = new Set(
      intervento.categorie.map((categoria) => categoria.slug),
    )

    for (const categoria of intervento.categorie) {
      if (!categoriaSlugSet.has(categoria.slug)) {
        throw new Error(
          `Intervento '${intervento.slug}' referenzia categoria inesistente '${categoria.slug}'`,
        )
      }
    }

    for (const servizio of intervento.servizi) {
      if (!matchedCategoriaSlugs.has(servizio.catSlug)) {
        throw new Error(
          `Intervento '${intervento.slug}' referenzia servizio di categoria '${servizio.catSlug}' non presente nelle categorie compatibili`,
        )
      }

      const slug = servizioSlug(servizio.catSlug, servizio.nome)

      if (!servizioSlugSet.has(slug)) {
        throw new Error(
          `Intervento '${intervento.slug}' referenzia servizio inesistente '${slug}'`,
        )
      }
    }
  }
}