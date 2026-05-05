type ShowcaseRef =
  | {
      status: string
      expiresAt: Date
    }
  | null
  | undefined

/**
 * SSOT interno: verifica se una vetrina è attiva.
 *
 * ⚠️ NON usare per logica pubblica (listing, profili, funnel).
 * Per quello usare public-showcase-company.ts
 */
export function isActiveShowcase(
  showcase: ShowcaseRef,
  now: Date = new Date(),
): boolean {
  if (!showcase) return false

  return showcase.status === 'ACTIVE' && showcase.expiresAt > now
}