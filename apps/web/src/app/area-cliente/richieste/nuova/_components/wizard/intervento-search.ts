import type { Intervento, RankedIntervento } from './types'

export function normalizeComparisonText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getSearchVariants(query: string) {
  const normalizedQuery = normalizeComparisonText(query)

  if (!normalizedQuery) {
    return []
  }

  const variants = new Set<string>([normalizedQuery])
  const queryTokens = normalizedQuery.split(' ').filter(Boolean)

  for (const token of queryTokens) {
    variants.add(token)

    if (token.length >= 4) {
      variants.add(token.slice(0, -1))
    }

    if (token.endsWith('i') && token.length >= 4) {
      variants.add(`${token.slice(0, -1)}o`)
    }

    if (token.endsWith('e') && token.length >= 4) {
      variants.add(`${token.slice(0, -1)}a`)
    }
  }

  return Array.from(variants).filter((variant) => variant.length >= 2)
}

function hasWholeWordMatch(candidate: string, variants: string[]) {
  const words = normalizeComparisonText(candidate).split(' ').filter(Boolean)
  return variants.some((variant) => words.includes(variant))
}

function scoreCandidate(candidate: string, variants: string[], weight: number) {
  const normalizedCandidate = normalizeComparisonText(candidate)
  let score = 0

  for (const variant of variants) {
    if (normalizedCandidate === variant) {
      score = Math.max(score, weight + 1000)
      continue
    }

    if (normalizedCandidate.startsWith(variant)) {
      score = Math.max(score, weight + 100)
    }

    if (normalizedCandidate.includes(variant)) {
      score = Math.max(score, weight + 70)
    }

    if (hasWholeWordMatch(normalizedCandidate, [variant])) {
      score = Math.max(score, weight + 200)
    }
  }

  return score
}

export function getKeywordBoost(intervento: Intervento) {
  const normalizedName = normalizeComparisonText(intervento.nome)
  const priorityKeywords = ['bagno', 'casa', 'perdita', 'facciata']

  return priorityKeywords.some((keyword) => normalizedName.includes(keyword)) ? 50 : 0
}

function getInterventoSearchScore(intervento: Intervento, query: string, position: number) {
  const variants = getSearchVariants(query)

  if (variants.length === 0) {
    return null
  }

  const nomeScore = scoreCandidate(intervento.nome, variants, 0)
  const aliasScore = Math.max(
    0,
    ...(intervento.alias ?? []).map((alias) => scoreCandidate(alias, variants, -20)),
  )
  const searchTermsScore = Math.max(
    0,
    ...(intervento.searchTerms ?? []).map((term) => scoreCandidate(term, variants, -40)),
  )
  const baseScore = Math.max(nomeScore, aliasScore, searchTermsScore)

  if (baseScore <= 0) {
    return null
  }

  const orderBoost = Math.max(0, 100 - position)
  return baseScore + orderBoost + getKeywordBoost(intervento)
}

export function getSuggestedInterventi(interventi: Intervento[], searchQuery: string) {
  return interventi
    .map((intervento, index) => {
      const score = getInterventoSearchScore(intervento, searchQuery, index)
      return score === null ? null : { ...intervento, score, position: index }
    })
    .filter(
      (intervento): intervento is RankedIntervento & { position: number } =>
        intervento !== null,
    )
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.position !== b.position) return a.position - b.position
      return a.nome.localeCompare(b.nome, 'it')
    })
    .slice(0, 6)
}

export function getPopularInterventi(interventi: Intervento[]) {
  return interventi
    .map((intervento, index) => ({ intervento, index }))
    .sort((a, b) => {
      const businessBoostDiff = getKeywordBoost(b.intervento) - getKeywordBoost(a.intervento)
      if (businessBoostDiff !== 0) return businessBoostDiff
      if (a.index !== b.index) return a.index - b.index
      return a.intervento.nome.localeCompare(b.intervento.nome, 'it')
    })
    .map(({ intervento }) => intervento)
    .slice(0, 6)
}
