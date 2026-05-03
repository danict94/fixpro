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

  if (!normalizedQuery) return null

  const queryTokens = normalizedQuery.split(' ').filter(Boolean)
  if (queryTokens.length === 0) return null

  const haystack = normalizeComparisonText(
    [servizio.nome, servizio.descrizione ?? '', categoriaNome, settoreNome].join(' '),
  )

  let score = 0

  if (haystack === normalizedQuery) score += 1000
  if (haystack.includes(normalizedQuery)) score += 400

  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 120
    if (token.length >= 4 && haystack.includes(token.slice(0, -1))) score += 60
  }

  if (score <= 0) return null

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
    if (!selectedMacroGroup) return interventi

    const allowed = new Set(getGroupDetailInterventoSlugs(selectedMacroGroup))
    return interventi.filter((i) => allowed.has(i.slug))
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
    () => interventi.find((i) => i.id === interventoId) ?? null,
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
            .map((m) => {
              const cat = categorieById.get(m.categoriaId)

              return cat
                ? {
                    ...cat,
                    isPrimary: m.isPrimary,
                    priorita: m.priorita,
                  }
                : null
            })
            .filter((c): c is CategoriaCompatibile => c !== null)
        : [],
    [categorieById, selectedIntervento],
  )

  const categoriaDerivata = useMemo(() => {
    if (!selectedIntervento) return null

    return (
      categorieCompatibili.find((c) => c.id === categoriaId) ??
      categorieCompatibili.find((c) => c.isPrimary) ??
      categorieCompatibili[0] ??
      null
    )
  }, [categorieCompatibili, categoriaId, selectedIntervento])

  const interventiFiltratiPerCategoria = useMemo(() => {
    if (!categoriaId) return filteredInterventi

    return filteredInterventi.filter((intervento) =>
      intervento.matchingCategorie.some((c) => c.categoriaId === categoriaId),
    )
  }, [filteredInterventi, categoriaId])

  const suggestedInterventi = useMemo(
    () => getSuggestedInterventi(interventiFiltratiPerCategoria, searchQuery),
    [interventiFiltratiPerCategoria, searchQuery],
  )

  const suggestedInterventoNames = useMemo(
    () => new Set(suggestedInterventi.map((intervento) => normalizeComparisonText(intervento.nome))),
    [suggestedInterventi],
  )

  const suggestedServizi = useMemo<SuggestedServizio[]>(() => {
    return serviziDisponibili
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
      .filter((s): s is SuggestedServizio => s !== null)
      .filter((servizio) => !suggestedInterventoNames.has(normalizeComparisonText(servizio.nome)))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.nome.localeCompare(b.nome, 'it')
      })
      .slice(0, 6)
  }, [serviziDisponibili, searchQuery, suggestedInterventoNames])

  const popularInterventi = useMemo(
    () => getPopularInterventi(interventiFiltratiPerCategoria),
    [interventiFiltratiPerCategoria],
  )

  return {
    selectedMacroGroup,
    filteredInterventi: interventiFiltratiPerCategoria,
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