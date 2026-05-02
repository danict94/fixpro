import type { LucideIcon } from 'lucide-react'

export interface Servizio {
  id: string
  slug: string
  nome: string
  categoriaId: string
  descrizione?: string | null
}

export interface Categoria {
  id: string
  slug: string
  nome: string
  servizi: Servizio[]
}

export interface Settore {
  id: string
  nome: string
  categorie: Categoria[]
}

export interface InterventoMatchingCategoria {
  categoriaId: string
  priorita: number
  isPrimary: boolean
}

export type CategoriaCompatibile = Categoria & {
  settoreId: string
  settoreNome: string
  isPrimary: boolean
  priorita: number
}

export interface Intervento {
  id: string
  slug: string
  nome: string
  descrizione: string | null
  alias: string[]
  searchTerms: string[]
  matchingCategorie: InterventoMatchingCategoria[]
}

export type MeasurementType = 'mq' | 'lineare' | 'elementi'
export type DimensionMode = 'none' | 'surface' | 'surface-and-quantity'
export type RankedIntervento = Intervento & { score: number }

export type SuggestedServizio = Servizio & {
  score: number
  categoriaNome: string
  categoriaSlug: string
  settoreNome: string
}

export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL'
export type Urgency =
  | 'WITHIN_1_MONTH'
  | 'WITHIN_3_MONTHS'
  | 'WITHIN_6_MONTHS'
  | 'NO_PREFERENCE'

export type Intention = 'YES' | 'MAYBE' | 'INFO_ONLY'
export type WorkType = 'SMALL' | 'FULL' | 'UNKNOWN'

export interface WorkTypeOption {
  value: WorkType
  title: string
  description: string
  icon: LucideIcon
}

export interface NuovaRichiestaWizardProps {
  settori: Settore[]
  interventi: Intervento[]
  isGuest?: boolean
  initialUser?: {
    name: string
    surname: string
    email: string
    phone: string
  }
  targetCompany?: {
    id: string
    ragioneSociale: string
  } | null
  initialInterventoId?: string
  initialSettoreId?: string
  initialCategoriaId?: string
  initialServizioId?: string
}