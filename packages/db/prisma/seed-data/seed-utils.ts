import type { InterventoCategoriaSeed } from './seed-types'

export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function servizioSlug(categoriaSlug: string, servizioNome: string): string {
  return `${categoriaSlug}-${toSlug(servizioNome)}`
}

export function assertUnique(values: string[], label: string): void {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }

  if (duplicates.size > 0) {
    throw new Error(`${label} duplicati: ${Array.from(duplicates).join(', ')}`)
  }
}

export function assertOnePrimary(
  interventoSlug: string,
  categorie: InterventoCategoriaSeed[],
): void {
  const primary = categorie.filter((categoria) => categoria.isPrimary)

  if (primary.length !== 1) {
    throw new Error(
      `Intervento '${interventoSlug}' deve avere esattamente una categoria primary; trovate ${primary.length}`,
    )
  }
}