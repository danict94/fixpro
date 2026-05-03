import { POPULAR_CATEGORY_SLUGS, QUERY_SYNONYMS } from './wizard-constants'
import type { ProfessionSuggestion, SelectedCategoria, SettoreOption } from './wizard-types'
import { normalizeSearchText, unique } from './wizard-utils'

export function buildCategoriaIndex(settori: SettoreOption[]): SelectedCategoria[] {
  return settori.flatMap((settore) =>
    settore.categorie.map((categoria) => ({
      ...categoria,
      settoreId: settore.id,
      settoreNome: settore.nome,
    })),
  )
}

function getSuggestionReason(categoria: SelectedCategoria): string {
  if (categoria.alias?.length) return categoria.alias.slice(0, 3).join(', ')
  if (categoria.searchTerms?.length) return categoria.searchTerms.slice(0, 3).join(', ')
  if (categoria.descrizione) return categoria.descrizione
  return categoria.servizi.slice(0, 3).map((servizio) => servizio.nome).join(', ')
}

export function buildSuggestions({
  query,
  categories,
  selectedIds,
}: {
  query: string
  categories: SelectedCategoria[]
  selectedIds: string[]
}): ProfessionSuggestion[] {
  const q = normalizeSearchText(query)

  if (!q) {
    return categories
      .map((categoria) => ({
        ...categoria,
        score: POPULAR_CATEGORY_SLUGS.includes(categoria.slug)
          ? 100 - POPULAR_CATEGORY_SLUGS.indexOf(categoria.slug)
          : selectedIds.includes(categoria.id)
            ? 80
            : 0,
        reason: getSuggestionReason(categoria),
        preview: categoria.servizi.slice(0, 4).map((servizio) => servizio.nome),
      }))
      .filter((categoria) => categoria.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
  }

  const terms = unique([q, ...(QUERY_SYNONYMS[q] ?? []).map(normalizeSearchText)])

  return categories
    .map((categoria) => {
      const name = normalizeSearchText(categoria.nome)
      const slug = normalizeSearchText(categoria.slug)
      const settore = normalizeSearchText(categoria.settoreNome)
      const aliases = (categoria.alias ?? []).map(normalizeSearchText)
      const searchTerms = (categoria.searchTerms ?? []).map(normalizeSearchText)
      const servizi = categoria.servizi.map((servizio) => normalizeSearchText(servizio.nome))

      let score = 0

      for (const term of terms) {
        if (name === term || slug === term) score += 120
        if (name.includes(term) || term.includes(name)) score += 90
        if (aliases.some((alias) => alias === term || alias.includes(term) || term.includes(alias))) score += 80
        if (searchTerms.some((searchTerm) => searchTerm.includes(term) || term.includes(searchTerm))) score += 70
        if (servizi.some((servizio) => servizio.includes(term) || term.includes(servizio))) score += 58
        if (settore.includes(term)) score += 25
      }

      if (selectedIds.includes(categoria.id)) score += 20

      return {
        ...categoria,
        score,
        reason: getSuggestionReason(categoria),
        preview: categoria.servizi.slice(0, 4).map((servizio) => servizio.nome),
      }
    })
    .filter((categoria) => categoria.score > 0)
    .sort((a, b) => b.score - a.score || a.nome.localeCompare(b.nome))
    .slice(0, 8)
}