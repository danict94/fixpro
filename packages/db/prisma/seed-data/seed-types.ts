export type CategoriaSeed = {
  nome: string
  slug: string
  descrizione: string
  alias: string[]
  searchTerms: string[]
  servizi: string[]
}

export type SettoreSeed = {
  nome: string
  slug: string
  descrizione: string
  fase: 'CORE' | 'ADJACENT'
  ordine: number
  categorie: CategoriaSeed[]
}

export type InterventoCategoriaSeed = {
  slug: string
  isPrimary: boolean
  priorita: number
}

export type InterventoServizioSeed = {
  catSlug: string
  nome: string
}

export type InterventoSeed = {
  nome: string
  slug: string
  descrizione: string
  alias: string[]
  searchTerms: string[]
  ordine: number
  categorie: InterventoCategoriaSeed[]
  servizi: InterventoServizioSeed[]
}

export type ShowcasePlanSeed = {
  tier: 'BASE' | 'PLUS' | 'PRO'
  name: string
  description: string
  monthlyPriceCents: number
  yearlyPriceCents: number
  discountPercent: number
  freeContactsPerMonth: number
  overQuotaDiscountPercent: number
  active: boolean
}