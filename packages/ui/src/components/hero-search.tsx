'use client'

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Search, Tag, Wrench } from 'lucide-react'
import { cn } from '../lib/cn'

export type SearchSuggestion =
  | {
      type: 'intervention'
      id: string
      nome: string
      slug: string
      descrizione?: string
      href: string
    }
  | {
      type: 'category'
      id: string
      nome: string
      slug: string
      settoreNome: string
      href: string
      keywords?: string[]
    }
  | {
      type: 'service'
      id: string
      nome: string
      slug: string
      categoriaNome: string
      categoriaSlug?: string
      settoreNome?: string
      href: string
      keywords?: string[]
    }

export interface HeroSearchProps {
  items: SearchSuggestion[]
  placeholder?: string
  searchHref?: string
  className?: string
  query?: string
  onQueryChange?: (value: string) => void
  filterMode?: 'local' | 'passthrough'
}

const MAX_RESULTS = 8
const INTERVENTION_LIMIT = 4
const CATEGORY_LIMIT = 4
const SERVICE_LIMIT = 4

function filterItems(items: SearchSuggestion[], query: string): SearchSuggestion[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const matches = (text: string) => text.toLowerCase().includes(q)
  const keywordMatches = (keywords?: string[]) =>
    keywords?.some((keyword) => keyword.toLowerCase().includes(q)) ?? false

  const interventions = items
    .filter(
      (item): item is SearchSuggestion & { type: 'intervention' } =>
        item.type === 'intervention' &&
        (matches(item.nome) || matches(item.slug) || matches(item.descrizione ?? '')),
    )
    .slice(0, INTERVENTION_LIMIT)

  const categories = items
    .filter(
      (item): item is SearchSuggestion & { type: 'category' } =>
        item.type === 'category' &&
        (matches(item.nome) ||
          matches(item.slug) ||
          matches(item.settoreNome) ||
          keywordMatches(item.keywords)),
    )
    .slice(0, CATEGORY_LIMIT)

  const services = items
    .filter(
      (item): item is SearchSuggestion & { type: 'service' } =>
        item.type === 'service' &&
        (matches(item.nome) ||
          matches(item.slug) ||
          matches(item.categoriaNome) ||
          matches(item.settoreNome ?? '') ||
          keywordMatches(item.keywords)),
    )
    .slice(0, SERVICE_LIMIT)

  return [...interventions, ...categories, ...services].slice(0, MAX_RESULTS)
}

export function HeroSearch({
  items,
  placeholder = 'Esempio: ristrutturazione bagno',
  searchHref = '/richiesta',
  className,
  query: controlledQuery,
  onQueryChange,
  filterMode = 'local',
}: HeroSearchProps) {
  const [internalQuery, setInternalQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerId = useId()
  const query = controlledQuery ?? internalQuery

  const results =
    filterMode === 'passthrough'
      ? query.trim()
        ? items.slice(0, MAX_RESULTS)
        : []
      : filterItems(items, query)

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const container = document.getElementById(containerId)
      if (container && !container.contains(event.target as Node)) {
        setOpen(false)
        setHighlighted(-1)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [containerId])

  useEffect(() => {
    if (query.trim().length === 0) {
      setOpen(false)
      setHighlighted(-1)
      return
    }

    if (results.length > 0) {
      setOpen(true)
      return
    }

    if (filterMode === 'local') {
      setOpen(true)
    }
  }, [filterMode, query, results.length])

  function navigateToFreeSearch() {
    const trimmed = query.trim()
    if (trimmed) {
      window.location.assign(`${searchHref}?q=${encodeURIComponent(trimmed)}`)
      return
    }
    window.location.assign(searchHref)
  }

  function handleInput(value: string) {
    if (controlledQuery === undefined) {
      setInternalQuery(value)
    }
    onQueryChange?.(value)
    setHighlighted(-1)
    setOpen(value.trim().length > 0)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (event.key === 'Enter') {
        event.preventDefault()
        navigateToFreeSearch()
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted((current) => Math.min(current + 1, results.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((current) => Math.max(current - 1, -1))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      if (highlighted >= 0 && results[highlighted]) {
        window.location.assign(results[highlighted].href)
        return
      }

      navigateToFreeSearch()
      return
    }

    if (event.key === 'Escape') {
      setOpen(false)
      setHighlighted(-1)
      inputRef.current?.blur()
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (highlighted >= 0 && results[highlighted]) {
      window.location.assign(results[highlighted].href)
      return
    }

    navigateToFreeSearch()
  }

  return (
    <div id={containerId} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} role="search" aria-label="Cerca intervento, categoria o servizio">
        <div className="flex items-center gap-2.5 rounded-xl border border-input bg-card px-3.5 py-2.5 shadow-soft transition duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
          <Search className="h-[18px] w-[18px] shrink-0 stroke-success" strokeWidth={2} aria-hidden="true" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => handleInput(event.target.value)}
            onFocus={() => query.trim() && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className="min-h-6 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
            aria-label="Cerca intervento, categoria o servizio"
            aria-autocomplete="list"
            aria-expanded={open && results.length > 0}
            aria-controls={open ? `${containerId}-list` : undefined}
            aria-activedescendant={highlighted >= 0 ? `${containerId}-item-${highlighted}` : undefined}
          />

          <button
            type="submit"
            className="shrink-0 rounded-xl bg-primary px-3.5 py-2 text-[14px] font-semibold text-primary-foreground shadow-soft transition duration-150 hover:bg-primary/90 active:scale-[0.98]"
          >
            Cerca
          </button>
        </div>
      </form>

      {open && results.length > 0 && (
        <ul
          id={`${containerId}-list`}
          role="listbox"
          aria-label="Suggerimenti"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        >
          {results.map((item, index) => {
            const isHighlighted = index === highlighted

            return (
              <li
                key={`${item.type}-${item.id}`}
                id={`${containerId}-item-${index}`}
                role="option"
                aria-selected={isHighlighted}
              >
                <a
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150',
                    isHighlighted ? 'bg-muted' : 'hover:bg-muted',
                    index < results.length - 1 && 'border-b border-border',
                  )}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => setOpen(false)}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted">
                    {item.type === 'intervention' ? (
                      <Search className="h-4 w-4 stroke-primary" strokeWidth={1.9} aria-hidden="true" />
                    ) : item.type === 'category' ? (
                      <Tag className="h-4 w-4 stroke-primary" strokeWidth={1.9} aria-hidden="true" />
                    ) : (
                      <Wrench className="h-4 w-4 stroke-success" strokeWidth={1.9} aria-hidden="true" />
                    )}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold text-foreground">{item.nome}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {item.type === 'intervention'
                        ? item.descrizione ?? 'Intervento cliente'
                        : item.type === 'category'
                          ? item.settoreNome
                          : item.settoreNome
                            ? `${item.categoriaNome} · ${item.settoreNome}`
                            : item.categoriaNome}
                    </span>
                  </span>

                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium',
                      item.type === 'service' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary',
                    )}
                  >
                    {item.type === 'intervention'
                      ? 'Intervento'
                      : item.type === 'category'
                        ? 'Categoria'
                        : 'Servizio'}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
