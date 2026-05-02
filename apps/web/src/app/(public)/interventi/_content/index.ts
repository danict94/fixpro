import type { InterventoContent } from './types'
import { interventiBySlug } from './shared'
import {
  rifacimentoBagnoContent,
  ristrutturazioneAppartamentoContent,
  perditaAcquaContent,
  tinteggiaturaCasaContent,
  installazioneClimatizzatoreContent,
  traslocoAppartamentoContent,
} from './data'

export {
  interventiBySlug,
  interventoCostFactors,
  interventoHowItWorksSteps,
  interventoRequestTips,
} from './shared'

export {
  geoCities,
  geoEnabledInterventions,
  geoProfessionisti,
  getEnabledGeoCitiesForIntervento,
  getCityOrNull,
  getGeoInterventoSeo,
  isGeoInterventoEnabled,
} from './geo'

export type {
  PriceSummary,
  DetailedCostItem,
  RealExample,
  FaqItem,
  GuideStep,
  MaterialItem,
  CostSignal,
  InterventoContent,
} from './types'

export const interventoContentBySlug = {
  [rifacimentoBagnoContent.slug]: rifacimentoBagnoContent,
  [ristrutturazioneAppartamentoContent.slug]: ristrutturazioneAppartamentoContent,
  [perditaAcquaContent.slug]: perditaAcquaContent,
  [tinteggiaturaCasaContent.slug]: tinteggiaturaCasaContent,
  [installazioneClimatizzatoreContent.slug]: installazioneClimatizzatoreContent,
  [traslocoAppartamentoContent.slug]: traslocoAppartamentoContent,
} satisfies Record<string, InterventoContent>

export function getInterventoOrNull(slug: string) {
  return interventiBySlug[slug] ?? null
}

export function getInterventoContentOrNull(slug: string) {
  return interventoContentBySlug[slug] ?? null
}
