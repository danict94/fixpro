import type { InterventoContent } from './types'

type InterventoSummary = {
  slug: string
  nome: string
}

export const geoCities = {
  roma: {
    slug: 'roma',
    name: 'Roma',
    label: 'Roma',
    province: 'RM',
    region: 'Lazio',
    localNotes:
      'Centro storico, parcheggi e tempi di accesso possono spostare costi e organizzazione del lavoro.',
    modifier:
      'Centro storico, parcheggi e tempi di accesso possono spostare costi e organizzazione del lavoro.',
  },
  milano: {
    slug: 'milano',
    name: 'Milano',
    label: 'Milano',
    province: 'MI',
    region: 'Lombardia',
    localNotes:
      'Disponibilita di professionisti alta, ma nei quartieri centrali la logistica tende a pesare di piu.',
    modifier:
      'Disponibilita di professionisti alta, ma nei quartieri centrali la logistica tende a pesare di piu.',
  },
  torino: {
    slug: 'torino',
    name: 'Torino',
    label: 'Torino',
    province: 'TO',
    region: 'Piemonte',
    localNotes:
      'Mercato piu stabile su molti interventi, con buona disponibilita di squadre per lavori programmabili.',
    modifier:
      'Mercato piu stabile su molti interventi, con buona disponibilita di squadre per lavori programmabili.',
  },
  bologna: {
    slug: 'bologna',
    name: 'Bologna',
    label: 'Bologna',
    province: 'BO',
    region: 'Emilia-Romagna',
    localNotes:
      'In centro storico accessi e sosta possono incidere soprattutto su traslochi e lavori con materiali pesanti.',
    modifier:
      'In centro storico accessi e sosta possono incidere soprattutto su traslochi e lavori con materiali pesanti.',
  },
} as const

export type GeoCitySlug = keyof typeof geoCities
export type GeoCity = (typeof geoCities)[GeoCitySlug]

export const geoEnabledInterventions: Record<string, readonly GeoCitySlug[]> = {
  'rifacimento-bagno': ['milano', 'roma', 'torino'],
  'ristrutturazione-appartamento': ['milano', 'roma', 'torino'],
  'perdita-acqua': ['milano', 'roma', 'torino'],
  'tinteggiatura-casa': ['milano', 'roma', 'torino'],
  'installazione-climatizzatore': ['milano', 'roma', 'torino'],
  'trasloco-appartamento': ['milano', 'roma', 'torino'],
}

export const geoProfessionisti = [
  { name: 'Studio Casa Service', badge: 'Disponibile questa settimana' },
  { name: 'Impresa Punto Lavori', badge: 'Risponde rapidamente' },
  { name: 'Artigiani in Rete', badge: 'Gestisce lavori simili in zona' },
] as const

export function getEnabledGeoCitiesForIntervento(slug: string) {
  return (geoEnabledInterventions[slug] ?? []).map((citySlug) => geoCities[citySlug])
}

export function getCityOrNull(citySlug: string) {
  return geoCities[citySlug as GeoCitySlug] ?? null
}

export function isGeoInterventoEnabled(slug: string, citySlug: string) {
  return (geoEnabledInterventions[slug] ?? []).includes(citySlug as GeoCitySlug)
}

export function getGeoInterventoSeo({
  intervento,
  content,
  city,
}: {
  intervento: InterventoSummary
  content: InterventoContent
  city: GeoCity
}) {
  return {
    title: `${intervento.nome} a ${city.name}: costi e professionisti | FixPro`,
    description: `Scopri ${intervento.nome.toLowerCase()} a ${city.name}, prezzi locali e come richiedere un preventivo su FixPro.`,
    intro:
      `Per ${intervento.nome.toLowerCase()} a ${city.name}, il preventivo dipende da accesso, tempi di intervento e disponibilita dei professionisti in zona.`,
    priceRange: content.price.range,
    priceNote: content.price.note,
    localNotes: city.localNotes,
  }
}
