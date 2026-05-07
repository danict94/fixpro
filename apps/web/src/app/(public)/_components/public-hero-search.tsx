'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { homeInterventi } from '@fixpro/shared'
import { HeroSearch, type SearchSuggestion } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

type SearchInterventoItem = {
  id: string
  nome: string
  slug: string
  descrizione: string | null
}

type SearchCategoriaItem = {
  id: string
  nome: string
  slug: string
  settore: {
    nome: string
  }
}

type SearchServizioItem = {
  id: string
  nome: string
  slug: string
  categoria: {
    nome: string
  }
}

const HERO_DEFAULT_SUGGESTIONS_LIMIT = 6

const defaultHeroSuggestions: SearchSuggestion[] = homeInterventi
  .slice(0, HERO_DEFAULT_SUGGESTIONS_LIMIT)
  .map(
    (item): SearchSuggestion => ({
      type: 'intervention',
      id: item.slug,
      nome: item.nome,
      slug: item.slug,
      descrizione: item.descrizione,
      href: `/richiesta?intervento=${item.slug}`,
    }),
  )

export function PublicHeroSearch() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim())

  const searchQuery = trpc.taxonomy.searchTaxonomy.useQuery(
    { q: deferredQuery },
    {
      enabled: deferredQuery.length >= 2,
    },
  )

  const remoteItems = useMemo<SearchSuggestion[]>(() => {
    if (deferredQuery.length < 2 || !searchQuery.data) return []

    const interventi = (searchQuery.data.interventi as SearchInterventoItem[]).map(
      (item): SearchSuggestion => ({
        type: 'intervention',
        id: item.id,
        nome: item.nome,
        slug: item.slug,
        descrizione: item.descrizione ?? undefined,
        href: `/richiesta?intervento=${item.slug}`,
      }),
    )

    const categorie = (searchQuery.data.categorie as SearchCategoriaItem[]).map(
      (item): SearchSuggestion => ({
        type: 'category',
        id: item.id,
        nome: item.nome,
        slug: item.slug,
        settoreNome: item.settore.nome,
        href: `/${item.slug}`,
      }),
    )

    const servizi = (searchQuery.data.servizi as SearchServizioItem[]).map(
      (item): SearchSuggestion => ({
        type: 'service',
        id: item.id,
        nome: item.nome,
        slug: item.slug,
        categoriaNome: item.categoria.nome,
        href: `/richiesta?servizio=${item.slug}`,
      }),
    )

    return [...interventi, ...categorie, ...servizi]
  }, [deferredQuery.length, searchQuery.data])

  const items = deferredQuery.length >= 2 && searchQuery.data ? remoteItems : defaultHeroSuggestions

  return (
    <HeroSearch
      items={items}
      placeholder="Che lavoro devi fare? Es. ristrutturazione bagno"
      searchHref="/richiesta"
      className="w-full"
      query={query}
      onQueryChange={setQuery}
      filterMode="passthrough"
      showSuggestionsOnFocus
    />
  )
}
