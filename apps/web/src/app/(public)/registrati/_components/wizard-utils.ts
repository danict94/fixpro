export function normalizePhone(raw: string): string {
  const normalized = raw.replace(/[\s\-().]/g, '')

  if (normalized.startsWith('+')) {
    return normalized
  }

  if (normalized.startsWith('0039')) {
    return `+39${normalized.slice(4)}`
  }

  if (normalized.startsWith('39') && normalized.length >= 11) {
    return `+${normalized}`
  }

  return `+39${normalized}`
}

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

export function normalizeProvince(value: string): string {
  return value.trim().toUpperCase().slice(0, 2)
}

export function hasValidCoordinates(lat: number | null, lng: number | null): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}