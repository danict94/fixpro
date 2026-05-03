import { api } from '@/lib/trpc/server'
import { resolveRequestInterventoSlug } from '@/lib/taxonomy/interventi'

type SettoriData = Awaited<ReturnType<typeof api.taxonomy.getSettori>>
type InterventiData = Awaited<ReturnType<typeof api.taxonomy.getInterventi>>
type SearchResults = Awaited<ReturnType<typeof api.taxonomy.searchTaxonomy>>

type SearchParams = Partial<
  Record<'categoria' | 'servizio' | 'intervento' | 'q', string>
>

type PrefillState = {
  initialSettoreId?: string
  initialInterventoId?: string
  initialCategoriaId?: string
  initialServizioId?: string
}

function findCategoryBySlug(
  settori: SettoriData,
  slug: string,
): Pick<PrefillState, 'initialSettoreId' | 'initialCategoriaId'> | null {
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

function findServiceBySlug(
  settori: SettoriData,
  slug: string,
):
  | Pick<
      PrefillState,
      'initialSettoreId' | 'initialCategoriaId' | 'initialServizioId'
    >
  | null {
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

function getInterventiByCategoria(
  interventi: InterventiData,
  categoriaId: string,
): InterventiData {
  return interventi.filter((intervento) =>
    intervento.matchingCategorie.some(
      (matchingCategoria) => matchingCategoria.categoriaId === categoriaId,
    ),
  )
}

function getInterventiByServizio(
  interventi: InterventiData,
  categoriaId: string,
  servizioId: string,
): InterventiData {
  return interventi.filter(
    (intervento) =>
      intervento.matchingCategorie.some(
        (matchingCategoria) => matchingCategoria.categoriaId === categoriaId,
      ) &&
      intervento.matchingServizi.some(
        (matchingServizio) => matchingServizio.servizioId === servizioId,
      ),
  )
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
    intervento.matchingCategorie.find(
      (matchingCategoria) => matchingCategoria.isPrimary,
    ) ?? intervento.matchingCategorie[0]

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
    servizio?.initialServizioId &&
    servizio.initialCategoriaId === state.initialCategoriaId &&
    intervento.matchingServizi.some(
      (matchingServizio) =>
        matchingServizio.servizioId === servizio.initialServizioId,
    )
  ) {
    state.initialServizioId = servizio.initialServizioId
  }

  return state
}

function resolveKnownIntervento(
  interventi: InterventiData,
  servizioSlug: string | undefined,
  settori: SettoriData,
  interventoSlug: string,
): PrefillState {
  const exactMatch = resolveFromIntervento(
    interventi,
    servizioSlug,
    settori,
    interventoSlug,
  )

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
  const categoriaSlug = params.categoria
  const servizioSlug = params.servizio
  let interventoSlug = params.intervento

  /**
   * SEARCH
   *
   * Se arriva solo `q`, non scegliamo automaticamente quando ci sono
   * più risultati. Possiamo precompilare l'intervento solo se il search
   * restituisce esattamente un intervento.
   */
  if (!interventoSlug && !categoriaSlug && !servizioSlug && searchResults) {
    const [singleIntervento] = searchResults.interventi

    if (searchResults.interventi.length === 1 && singleIntervento) {
      interventoSlug = singleIntervento.slug
    }
  }

  /**
   * INTERVENTO
   *
   * È l'unico caso in cui possiamo risolvere direttamente il target reale
   * del funnel cliente.
   */
  if (interventoSlug) {
    return resolveKnownIntervento(
      interventi,
      servizioSlug,
      settori,
      interventoSlug,
    )
  }

  /**
   * SERVIZIO
   *
   * Il servizio serve come contesto. Non scegliamo un intervento in modo
   * aggressivo, salvo il caso sicuro in cui esiste un solo intervento matchato.
   */
  if (servizioSlug) {
    const servizio = findServiceBySlug(settori, servizioSlug)

    if (!servizio?.initialCategoriaId || !servizio.initialServizioId) {
      return {}
    }

    const interventiMatch = getInterventiByServizio(
      interventi,
      servizio.initialCategoriaId,
      servizio.initialServizioId,
    )

    return {
      ...servizio,
      ...(interventiMatch.length === 1
        ? { initialInterventoId: interventiMatch[0].id }
        : {}),
    }
  }

  /**
   * CATEGORIA
   *
   * La categoria serve come contesto. Non scegliamo un intervento in modo
   * aggressivo, salvo il caso sicuro in cui esiste un solo intervento matchato.
   */
  if (categoriaSlug) {
    const categoria = findCategoryBySlug(settori, categoriaSlug)

    if (!categoria?.initialCategoriaId) {
      return {}
    }

    const interventiMatch = getInterventiByCategoria(
      interventi,
      categoria.initialCategoriaId,
    )

    return {
      ...categoria,
      ...(interventiMatch.length === 1
        ? { initialInterventoId: interventiMatch[0].id }
        : {}),
    }
  }

  return {}
}