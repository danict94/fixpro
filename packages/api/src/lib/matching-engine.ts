import type { prisma } from '@fixpro/db'

type MatchingDb = {
  matchingInterventoCat: {
    findMany(args: {
      where: {
        interventoId: { in: string[] }
        attivo: boolean
      }
      select: {
        interventoId: true
        categoriaId: true
      }
    }): Promise<Array<{ interventoId: string; categoriaId: string }>>
  }
}

export interface MatchingCompanyProfile {
  id: string
  lat: number | null
  lng: number | null
  province: string | null
  radiusKm: number
  workType: 'SMALL' | 'FULL' | 'BOTH'
  categoriaIds: string[]
  servizioIds: string[]
  settoreIds: string[]
}

export interface MatchingRequestProfile {
  id: string
  interventoId: string | null
  categoriaId: string
  servizioId: string | null
  workType: 'SMALL' | 'FULL' | 'UNKNOWN'
  settoreId: string
  lat: number | null
  lng: number | null
  province: string | null
  targetCompanyId?: string | null
}

export interface MatchingEvaluation {
  score: number
  geoMatched: boolean
  categoriaMatch: boolean
  servizioMatch: boolean
  interventoMatch: boolean
  workTypeMatch: boolean
  settoreMatch: boolean
  matchingTier: 'targeted' | 'intervento' | 'categoria' | 'settore' | 'none'
  matchesCompanyPreferences: boolean
}

export function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

export function cityOrProvinceMatches(left: string | null | undefined, right: string | null | undefined) {
  const leftValue = normalizeText(left)
  const rightValue = normalizeText(right)
  if (!leftValue || !rightValue) return false
  return leftValue === rightValue
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function loadInterventoCategoryMap(
  db: MatchingDb | typeof prisma,
  interventoIds: string[],
) {
  const uniqueIds = Array.from(new Set(interventoIds.filter(Boolean)))
  const map = new Map<string, Set<string>>()

  if (uniqueIds.length === 0) {
    return map
  }

  const rows = await db.matchingInterventoCat.findMany({
    where: {
      interventoId: { in: uniqueIds },
      attivo: true,
    },
    select: {
      interventoId: true,
      categoriaId: true,
    },
  })

  for (const row of rows) {
    const current = map.get(row.interventoId) ?? new Set<string>()
    current.add(row.categoriaId)
    map.set(row.interventoId, current)
  }

  return map
}

export function evaluateRequestCompanyMatch(args: {
  company: MatchingCompanyProfile
  request: MatchingRequestProfile
  interventoCategoryIds?: ReadonlySet<string>
  allowSectorFallback?: boolean
}): MatchingEvaluation {
  const { company, request, interventoCategoryIds, allowSectorFallback = false } = args
  const isTargeted = request.targetCompanyId === company.id

  let geoMatched = isTargeted
  if (!geoMatched) {
    if (
      request.lat !== null &&
      request.lng !== null &&
      company.lat !== null &&
      company.lng !== null
    ) {
      geoMatched = haversineKm(request.lat, request.lng, company.lat, company.lng) <= company.radiusKm
    } else {
      geoMatched = cityOrProvinceMatches(request.province, company.province)
    }
  }

  const categoriaMatch = company.categoriaIds.includes(request.categoriaId)
  const servizioMatch = request.servizioId ? company.servizioIds.includes(request.servizioId) : false
  const interventoMatch = request.interventoId
    ? company.categoriaIds.some((categoriaId) => interventoCategoryIds?.has(categoriaId) ?? false)
    : false
  const workTypeMatch =
    request.workType === 'UNKNOWN' ||
    company.workType === 'BOTH' ||
    company.workType === request.workType
  const settoreMatch = company.settoreIds.includes(request.settoreId)

  let matchingTier: MatchingEvaluation['matchingTier'] = 'none'

  if (isTargeted) {
    matchingTier = 'targeted'
  } else if (geoMatched) {
    if (request.interventoId) {
      matchingTier = interventoMatch ? 'intervento' : 'none'
    } else if (categoriaMatch) {
      matchingTier = 'categoria'
    } else if (allowSectorFallback && settoreMatch) {
      matchingTier = 'settore'
    }
  }

  const score =
    (servizioMatch ? 3 : 0) +
    (categoriaMatch ? 2 : 0) +
    (interventoMatch ? 1 : 0) +
    (request.workType !== 'UNKNOWN' && workTypeMatch ? 1 : 0)

  return {
    score,
    geoMatched,
    categoriaMatch,
    servizioMatch,
    interventoMatch,
    workTypeMatch,
    settoreMatch,
    matchingTier,
    matchesCompanyPreferences:
      matchingTier === 'targeted' ||
      matchingTier === 'intervento' ||
      matchingTier === 'categoria',
  }
}

function tierWeight(tier: MatchingEvaluation['matchingTier']) {
  switch (tier) {
    case 'targeted':
      return 4
    case 'intervento':
      return 3
    case 'categoria':
      return 2
    case 'settore':
      return 1
    default:
      return 0
  }
}

export function sortMatches<T extends { evaluation: MatchingEvaluation; createdAt?: Date | null }>(
  items: T[],
) {
  return [...items].sort((left, right) => {
    const leftTier = tierWeight(left.evaluation.matchingTier)
    const rightTier = tierWeight(right.evaluation.matchingTier)

    if (rightTier !== leftTier) {
      return rightTier - leftTier
    }

    if (right.evaluation.score !== left.evaluation.score) {
      return right.evaluation.score - left.evaluation.score
    }

    const leftCreatedAt = left.createdAt?.getTime() ?? 0
    const rightCreatedAt = right.createdAt?.getTime() ?? 0
    return rightCreatedAt - leftCreatedAt
  })
}

export function selectMatchingCompaniesForRequest<T extends MatchingCompanyProfile>(args: {
  companies: T[]
  request: MatchingRequestProfile
  interventoCategoryMap: ReadonlyMap<string, ReadonlySet<string>>
}) {
  const evaluated = args.companies.map((company) => ({
    company,
    evaluation: evaluateRequestCompanyMatch({
      company,
      request: args.request,
      interventoCategoryIds: args.request.interventoId
        ? args.interventoCategoryMap.get(args.request.interventoId)
        : undefined,
    }),
  }))

  const strictMatches = evaluated.filter(
    (item) =>
      item.evaluation.matchingTier === 'targeted' ||
      item.evaluation.matchingTier === 'intervento' ||
      item.evaluation.matchingTier === 'categoria',
  )

  if (strictMatches.length > 0) {
    return sortMatches(strictMatches)
  }

  const settoreFallback = evaluated
    .map((item) => ({
      ...item,
      evaluation: evaluateRequestCompanyMatch({
        company: item.company,
        request: args.request,
        interventoCategoryIds: args.request.interventoId
          ? args.interventoCategoryMap.get(args.request.interventoId)
          : undefined,
        allowSectorFallback: true,
      }),
    }))
    .filter((item) => item.evaluation.matchingTier !== 'none')

  return sortMatches(settoreFallback)
}
