import { api } from '@/lib/trpc/server'
import { resolveRequestInterventoSlug } from '@/lib/taxonomy/interventi'

type SettoriData = Awaited<ReturnType<typeof api.taxonomy.getSettori>>
type InterventiData = Awaited<ReturnType<typeof api.taxonomy.getInterventi>>
type SearchResults = Awaited<ReturnType<typeof api.taxonomy.searchTaxonomy>>

type SearchParams = Partial<Record<'categoria' | 'servizio' | 'intervento' | 'q', string>>

type PrefillState = {
  initialSettoreId?: string
  initialInterventoId?: string
  initialCategoriaId?: string
  initialServizioId?: string
}

function findCategoryBySlug(settori: SettoriData, slug: string) {
  for (const settore of settori) {
    const categoria = settore.categorie.find((item) => item.slug === slug)

    if (categoria) {
      return {
        initialSettoreId: settore.id,
        initialCategoriaId: categoria.id,
      }
    }
  }

  return null
}

function findServiceBySlug(settori: SettoriData, slug: string) {
  for (const settore of settori) {
    for (const categoria of settore.categorie) {
      const servizio = categoria.servizi.find((item) => item.slug === slug)

      if (servizio) {
        return {
          initialSettoreId: settore.id,
          initialCategoriaId: categoria.id,
          initialServizioId: servizio.id,
        }
      }
    }
  }

  return null
}

function inferBestInterventoId(
  interventi: InterventiData,
  categoriaId: string,
  servizioId?: string,
) {
  const matchingInterventi = interventi
    .filter(
      (intervento) =>
        intervento.matchingCategorie.some((item) => item.categoriaId === categoriaId) &&
        (!servizioId || intervento.matchingServizi.some((item) => item.servizioId === servizioId)),
    )
    .sort((left, right) => {
      const leftCategoria = left.matchingCategorie.find((item) => item.categoriaId === categoriaId)
      const rightCategoria = right.matchingCategorie.find(
        (item) => item.categoriaId === categoriaId,
      )

      if ((leftCategoria?.isPrimary ? 1 : 0) !== (rightCategoria?.isPrimary ? 1 : 0)) {
        return (rightCategoria?.isPrimary ? 1 : 0) - (leftCategoria?.isPrimary ? 1 : 0)
      }

      const leftPriority = leftCategoria?.priorita ?? Number.MAX_SAFE_INTEGER
      const rightPriority = rightCategoria?.priorita ?? Number.MAX_SAFE_INTEGER

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority
      }

      return left.nome.localeCompare(right.nome, 'it')
    })

  return matchingInterventi[0]?.id
}

function resolveServicePrefill(
  interventi: InterventiData,
  settori: SettoriData,
  servizioSlug: string,
): PrefillState {
  const servizio = findServiceBySlug(settori, servizioSlug)

  if (!servizio) {
    return {}
  }

  const initialInterventoId = inferBestInterventoId(
    interventi,
    servizio.initialCategoriaId,
    servizio.initialServizioId,
  )

  return {
    ...servizio,
    ...(initialInterventoId ? { initialInterventoId } : {}),
  }
}

function resolveFromIntervento(
  interventi: InterventiData,
  servizioSlug: string | undefined,
  settori: SettoriData,
  interventoSlug: string,
): PrefillState {
  const intervento = interventi.find((item) => item.slug === interventoSlug)

  if (!intervento) {
    return {}
  }

  const primaryMatch =
    intervento.matchingCategorie.find((item) => item.isPrimary) ?? intervento.matchingCategorie[0]

  const state: PrefillState = {
    initialInterventoId: intervento.id,
  }

  if (!primaryMatch) {
    return state
  }

  state.initialCategoriaId = primaryMatch.categoriaId
  state.initialSettoreId = primaryMatch.categoria.settoreId

  if (!servizioSlug) {
    return state
  }

  const servizio = findServiceBySlug(settori, servizioSlug)

  if (
    servizio &&
    servizio.initialCategoriaId === state.initialCategoriaId &&
    intervento.matchingServizi.some((item) => item.servizioId === servizio.initialServizioId)
  ) {
    state.initialServizioId = servizio.initialServizioId
  }

  return state
}

function resolveSearchCandidate(searchResults?: SearchResults) {
  if (!searchResults) {
    return null
  }

  const [intervento] = searchResults.interventi
  if (intervento) {
    return { type: 'intervento' as const, slug: intervento.slug }
  }

  const [servizio] = searchResults.servizi
  if (servizio) {
    return { type: 'servizio' as const, slug: servizio.slug }
  }

  const [categoria] = searchResults.categorie
  if (categoria) {
    return { type: 'categoria' as const, slug: categoria.slug }
  }

  return null
}

function resolveKnownIntervento(
  interventi: InterventiData,
  servizioSlug: string | undefined,
  settori: SettoriData,
  interventoSlug: string,
) {
  const exactMatch = resolveFromIntervento(interventi, servizioSlug, settori, interventoSlug)

  if (exactMatch.initialInterventoId) {
    return exactMatch
  }

  const requestSlug = resolveRequestInterventoSlug(interventoSlug)

  if (requestSlug === interventoSlug) {
    return {}
  }

  return resolveFromIntervento(interventi, servizioSlug, settori, requestSlug)
}

export function resolveRequestPrefill({
  params,
  settori,
  interventi,
  searchResults,
}: {
  params: SearchParams
  settori: SettoriData
  interventi: InterventiData
  searchResults?: SearchResults
}): PrefillState {
  let categoriaSlug = params.categoria
  let servizioSlug = params.servizio
  let interventoSlug = params.intervento

  if (!interventoSlug && !categoriaSlug && !servizioSlug) {
    const candidate = resolveSearchCandidate(searchResults)

    if (candidate?.type === 'intervento') interventoSlug = candidate.slug
    if (candidate?.type === 'servizio') servizioSlug = candidate.slug
    if (candidate?.type === 'categoria') categoriaSlug = candidate.slug
  }

  if (interventoSlug) {
    return resolveKnownIntervento(interventi, servizioSlug, settori, interventoSlug)
  }

  if (servizioSlug) {
    return resolveServicePrefill(interventi, settori, servizioSlug)
  }

  if (categoriaSlug) {
    const categoria = findCategoryBySlug(settori, categoriaSlug)

    if (categoria) {
      const initialInterventoId = inferBestInterventoId(interventi, categoria.initialCategoriaId)

      return {
        ...categoria,
        ...(initialInterventoId ? { initialInterventoId } : {}),
      }
    }
  }

  return {}
}