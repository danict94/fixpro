import { useMemo } from 'react'
import {
  getGroupDetailInterventoSlugs,
  macroInterventoGroups,
} from '@/lib/taxonomy/interventi'
import { getDimensionModeForIntervento } from './dimensions'
import {
  getPopularInterventi,
  getSuggestedInterventi,
  normalizeComparisonText,
} from './intervento-search'
import type {
  CategoriaCompatibile,
  Intervento,
  Settore,
  SuggestedServizio,
} from './types'

function getServizioSearchScore({
  servizio,
  categoriaNome,
  settoreNome,
  query,
  position,
}: {
  servizio: { nome: string; descrizione?: string | null }
  categoriaNome: string
  settoreNome: string
  query: string
  position: number
}) {
  const normalizedQuery = normalizeComparisonText(query)

  if (!normalizedQuery) {
    return null
  }

  const queryTokens = normalizedQuery.split(' ').filter(Boolean)

  if (queryTokens.length === 0) {
    return null
  }

  const haystack = normalizeComparisonText(
    [
      servizio.nome,
      servizio.descrizione ?? '',
      categoriaNome,
      settoreNome,
    ].join(' '),
  )

  let score = 0

  if (haystack === normalizedQuery) {
    score += 1000
  }

  if (haystack.includes(normalizedQuery)) {
    score += 400
  }

  for (const token of queryTokens) {
    if (haystack.includes(token)) {
      score += 120
    }

    if (token.length >= 4 && haystack.includes(token.slice(0, -1))) {
      score += 60
    }
  }

  if (score <= 0) {
    return null
  }

  return score + Math.max(0, 100 - position)
}

export function useRequestTaxonomy({
  settori,
  interventi,
  selectedMacroSlug,
  interventoId,
  categoriaId,
  searchQuery,
}: {
  settori: Settore[]
  interventi: Intervento[]
  selectedMacroSlug: string
  interventoId: string
  categoriaId: string
  searchQuery: string
}) {
  const selectedMacroGroup = useMemo(
    () =>
      selectedMacroSlug
        ? macroInterventoGroups.find((group) => group.slug === selectedMacroSlug) ?? null
        : null,
    [selectedMacroSlug],
  )

  const filteredInterventi = useMemo(() => {
    if (!selectedMacroGroup) {
      return interventi
    }

    const allowedInterventoSlugs = new Set(getGroupDetailInterventoSlugs(selectedMacroGroup))
    return interventi.filter((intervento) => allowedInterventoSlugs.has(intervento.slug))
  }, [interventi, selectedMacroGroup])

  const serviziDisponibili = useMemo(
    () =>
      settori.flatMap((settore) =>
        settore.categorie.flatMap((categoria) =>
          categoria.servizi.map((servizio) => ({
            ...servizio,
            categoriaNome: categoria.nome,
            categoriaSlug: categoria.slug,
            settoreNome: settore.nome,
          })),
        ),
      ),
    [settori],
  )

  const selectedIntervento = useMemo(
    () => interventi.find((intervento) => intervento.id === interventoId) ?? null,
    [interventi, interventoId],
  )

  const dimensionMode = useMemo(
    () => getDimensionModeForIntervento(selectedIntervento?.slug),
    [selectedIntervento?.slug],
  )

  const categorieById = useMemo(
    () =>
      new Map(
        settori.flatMap((settore) =>
          settore.categorie.map((categoria) => [
            categoria.id,
            { ...categoria, settoreId: settore.id, settoreNome: settore.nome },
          ] as const),
        ),
      ),
    [settori],
  )

  const categorieCompatibili = useMemo(
    () =>
      selectedIntervento
        ? selectedIntervento.matchingCategorie
            .map((matching) => {
              const categoria = categorieById.get(matching.categoriaId)

              return categoria
                ? {
                    ...categoria,
                    isPrimary: matching.isPrimary,
                    priorita: matching.priorita,
                  }
                : null
            })
            .filter((categoria): categoria is CategoriaCompatibile => categoria !== null)
        : [],
    [categorieById, selectedIntervento],
  )

  const categoriaDerivata = useMemo(
    () =>
      categorieCompatibili.find((categoria) => categoria.id === categoriaId) ??
      categorieById.get(categoriaId) ??
      categorieCompatibili.find((categoria) => categoria.isPrimary) ??
      categorieCompatibili[0] ??
      null,
    [categorieById, categorieCompatibili, categoriaId],
  )

  const suggestedInterventi = useMemo(
    () => getSuggestedInterventi(filteredInterventi, searchQuery),
    [filteredInterventi, searchQuery],
  )

  const suggestedServizi = useMemo<SuggestedServizio[]>(
    () =>
      serviziDisponibili
        .map((servizio, index) => {
          const score = getServizioSearchScore({
            servizio,
            categoriaNome: servizio.categoriaNome,
            settoreNome: servizio.settoreNome,
            query: searchQuery,
            position: index,
          })

          return score === null ? null : { ...servizio, score }
        })
        .filter((servizio): servizio is SuggestedServizio => servizio !== null)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          return a.nome.localeCompare(b.nome, 'it')
        })
        .slice(0, 6),
    [serviziDisponibili, searchQuery],
  )

  const popularInterventi = useMemo(
    () => getPopularInterventi(filteredInterventi),
    [filteredInterventi],
  )

  return {
    selectedMacroGroup,
    filteredInterventi,
    serviziDisponibili,
    selectedIntervento,
    dimensionMode,
    categorieCompatibili,
    categoriaDerivata,
    suggestedInterventi,
    suggestedServizi,
    popularInterventi,
  }
}