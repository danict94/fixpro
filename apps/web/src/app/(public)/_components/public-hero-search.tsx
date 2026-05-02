'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { HeroSearch, type SearchSuggestion } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

export function PublicHeroSearch() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim())

  const searchQuery = trpc.taxonomy.searchTaxonomy.useQuery(
    { q: deferredQuery },
    {
      enabled: deferredQuery.length >= 2,
    },
  )

  const items = useMemo<SearchSuggestion[]>(() => {
    if (deferredQuery.length < 2 || !searchQuery.data) return []

    const interventi: SearchSuggestion[] = searchQuery.data.interventi.map((item) => ({
      type: 'intervention',
      id: item.id,
      nome: item.nome,
      slug: item.slug,
      descrizione: item.descrizione ?? undefined,
      href: `/richiesta?intervento=${item.slug}`,
    }))

    const categorie: SearchSuggestion[] = searchQuery.data.categorie.map((item) => ({
      type: 'category',
      id: item.id,
      nome: item.nome,
      slug: item.slug,
      settoreNome: item.settore.nome,
      href: `/${item.slug}`,
    }))

    const servizi: SearchSuggestion[] = searchQuery.data.servizi.map((item) => ({
      type: 'service',
      id: item.id,
      nome: item.nome,
      slug: item.slug,
      categoriaNome: item.categoria.nome,
      href: `/richiesta?servizio=${item.slug}`,
    }))

    return [...interventi, ...categorie, ...servizi]
  }, [deferredQuery.length, searchQuery.data])

  return (
    <HeroSearch
      items={items}
      placeholder="Che lavoro devi fare? Es. ristrutturazione bagno"
      searchHref="/richiesta"
      className="w-full"
      query={query}
      onQueryChange={setQuery}
      filterMode="passthrough"
    />
  )
}