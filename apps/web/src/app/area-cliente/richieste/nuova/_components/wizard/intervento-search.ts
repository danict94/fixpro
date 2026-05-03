import type { Intervento, RankedIntervento } from './types'

const MIN_VARIANT_LENGTH = 2
const MAX_RESULTS = 6

export function normalizeComparisonText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value: string) {
  return normalizeComparisonText(value).split(' ').filter(Boolean)
}

function getTokenVariants(token: string) {
  const variants = new Set<string>()

  if (token.length < MIN_VARIANT_LENGTH) {
    return variants
  }

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

  if (token.endsWith('a') && token.length >= 4) {
    variants.add(`${token.slice(0, -1)}e`)
  }

  if (token.endsWith('o') && token.length >= 4) {
    variants.add(`${token.slice(0, -1)}i`)
  }

  return variants
}

function getSearchVariants(query: string) {
  const normalizedQuery = normalizeComparisonText(query)

  if (!normalizedQuery) {
    return []
  }

  const variants = new Set<string>([normalizedQuery])
  const queryTokens = tokenize(normalizedQuery)

  for (const token of queryTokens) {
    for (const variant of getTokenVariants(token)) {
      variants.add(variant)
    }
  }

  return Array.from(variants)
    .map((variant) => normalizeComparisonText(variant))
    .filter((variant) => variant.length >= MIN_VARIANT_LENGTH)
}

function getWholeWordMatchScore(candidateWords: string[], variant: string) {
  if (candidateWords.includes(variant)) {
    return 220
  }

  if (variant.length >= 4 && candidateWords.some((word) => word.startsWith(variant))) {
    return 140
  }

  return 0
}

function scoreCandidate(candidate: string, variants: string[], weight: number) {
  const normalizedCandidate = normalizeComparisonText(candidate)

  if (!normalizedCandidate) {
    return 0
  }

  const candidateWords = tokenize(normalizedCandidate)
  let score = 0

  for (const variant of variants) {
    if (normalizedCandidate === variant) {
      score = Math.max(score, weight + 1200)
      continue
    }

    if (normalizedCandidate.startsWith(variant)) {
      score = Math.max(score, weight + 450)
    }

    const wholeWordScore = getWholeWordMatchScore(candidateWords, variant)

    if (wholeWordScore > 0) {
      score = Math.max(score, weight + wholeWordScore)
    }

    if (normalizedCandidate.includes(variant)) {
      score = Math.max(score, weight + 90)
    }
  }

  return score
}

function getTokenCoverageScore(intervento: Intervento, query: string) {
  const queryTokens = tokenize(query)

  if (queryTokens.length === 0) {
    return 0
  }

  const searchableText = normalizeComparisonText(
    [
      intervento.nome,
      intervento.descrizione ?? '',
      ...(intervento.alias ?? []),
      ...(intervento.searchTerms ?? []),
    ].join(' '),
  )

  const matchedTokens = queryTokens.filter((token) => {
    const variants = Array.from(getTokenVariants(token))
    return variants.some((variant) => searchableText.includes(variant))
  })

  if (matchedTokens.length === 0) {
    return 0
  }

  return Math.round((matchedTokens.length / queryTokens.length) * 180)
}

function getInterventoSearchScore(intervento: Intervento, query: string, position: number) {
  const variants = getSearchVariants(query)

  if (variants.length === 0) {
    return null
  }

  const nomeScore = scoreCandidate(intervento.nome, variants, 0)

  const descrizioneScore = intervento.descrizione
    ? scoreCandidate(intervento.descrizione, variants, -180)
    : 0

  const aliasScore = Math.max(
    0,
    ...(intervento.alias ?? []).map((alias) => scoreCandidate(alias, variants, -40)),
  )

  const searchTermsScore = Math.max(
    0,
    ...(intervento.searchTerms ?? []).map((term) => scoreCandidate(term, variants, -80)),
  )

  const tokenCoverageScore = getTokenCoverageScore(intervento, query)

  const baseScore = Math.max(nomeScore, aliasScore, searchTermsScore, descrizioneScore)

  if (baseScore <= 0 && tokenCoverageScore <= 0) {
    return null
  }

  const orderBoost = Math.max(0, 60 - position)

  return baseScore + tokenCoverageScore + orderBoost
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
    .slice(0, MAX_RESULTS)
}

export function getPopularInterventi(interventi: Intervento[]) {
  return interventi.slice(0, MAX_RESULTS)
}