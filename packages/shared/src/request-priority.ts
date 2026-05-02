import type { ParsedRequestMetaItem } from './request-meta'

function normalizeValue(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

const PRIORITY_INTERVENTI = new Set([
  'ristrutturazione casa',
  'nuova costruzione casa',
  'rifacimento facciata',
])

export function isPriorityInterventoName(value: string | null | undefined) {
  if (!value) {
    return false
  }

  return PRIORITY_INTERVENTI.has(normalizeValue(value))
}

export function isSurfaceMetaItem(item: ParsedRequestMetaItem) {
  return normalizeValue(item.label).startsWith('superficie') || normalizeValue(item.value).includes('mq')
}

export function isQuantityMetaItem(item: ParsedRequestMetaItem) {
  return normalizeValue(item.label).startsWith('quantita')
}

export function isBathroomContext(value: string | null | undefined) {
  if (!value) {
    return false
  }

  return normalizeValue(value).includes('bagno') || normalizeValue(value).includes('bagni')
}
