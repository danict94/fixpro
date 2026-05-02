import { parseRequestDescription } from '@fixpro/shared'
import type { DimensionMode, MeasurementType } from './types'

export function getDimensionModeForIntervento(slug: string | undefined): DimensionMode {
  if (!slug) {
    return 'none'
  }

  const bathroomSlugs = new Set([
    'rifacimento-bagno',
    'sostituzione-sanitari',
    'sostituzione-vasca-doccia',
    'installazione-box-doccia',
    'sigillatura-bagno',
    'riparazione-scarico-wc',
    'posa-piastrelle-bagno',
  ])

  if (bathroomSlugs.has(slug) || slug.includes('bagno')) {
    return 'surface-and-quantity'
  }

  if (
    slug.includes('facciata') ||
    slug.includes('pavimento') ||
    slug.includes('balconi') ||
    slug.includes('frontalini') ||
    slug.includes('terrazzo') ||
    slug.includes('cappotto')
  ) {
    return 'surface'
  }

  return 'none'
}

export function getMeasurementTypeForDimensionMode({
  currentMeasurementType,
  nextDimensionMode,
}: {
  currentMeasurementType: MeasurementType
  nextDimensionMode: DimensionMode
}) {
  if (nextDimensionMode !== 'surface-and-quantity') {
    return 'mq'
  }

  return currentMeasurementType === 'mq' ? 'elementi' : currentMeasurementType
}

export function buildDescriptionWithDimensions({
  description,
  dimensionMode,
  surfaceMq,
  measurementType,
  quantity,
}: {
  description: string
  dimensionMode: DimensionMode
  surfaceMq: string
  measurementType: MeasurementType
  quantity: string
}) {
  const trimmedDescription = parseRequestDescription(description).description || description.trim()
  const dimensionDetails: string[] = []

  if (dimensionMode !== 'none' && surfaceMq.trim()) {
    dimensionDetails.push(`Superficie: ${surfaceMq.trim()} mq`)
  }

  if (dimensionMode === 'surface-and-quantity' && quantity.trim()) {
    const quantityUnit =
      measurementType === 'lineare'
        ? 'metri lineari'
        : measurementType === 'elementi'
          ? 'elementi'
          : 'unita'

    dimensionDetails.push(`Quantita: ${quantity.trim()} ${quantityUnit}`)
  }

  if (dimensionDetails.length === 0) {
    return trimmedDescription
  }

  return `[META]\n${dimensionDetails.join('\n')}\n\nDescrizione:\n${trimmedDescription}`
}
