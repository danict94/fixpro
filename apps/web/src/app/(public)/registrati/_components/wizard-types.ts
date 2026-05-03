export type Role = 'CLIENT' | 'COMPANY'

export interface ServizioOption {
  id: string
  nome: string
}

export interface CategoriaOption {
  id: string
  nome: string
  slug: string
  descrizione?: string | null
  alias?: string[]
  searchTerms?: string[]
  servizi: ServizioOption[]
}

export interface SettoreOption {
  id: string
  nome: string
  slug?: string
  categorie: CategoriaOption[]
}

export type SelectedCategoria = CategoriaOption & {
  settoreId: string
  settoreNome: string
}

export type ProfessionSuggestion = SelectedCategoria & {
  score: number
  reason: string
  preview: string[]
}

export interface RegistrazioneWizardProps {
  settori: SettoreOption[]
}