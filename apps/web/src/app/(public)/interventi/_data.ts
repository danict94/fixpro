// Compat layer: keep temporary re-exports for older imports.
// TODO: remove this file once all external references import from ./_content directly.
export {
  getInterventoContentOrNull,
  getInterventoOrNull,
  geoCities,
  geoEnabledInterventions,
  geoProfessionisti,
  getCityOrNull,
  getEnabledGeoCitiesForIntervento,
  getGeoInterventoSeo,
  interventiBySlug,
  interventoContentBySlug,
  interventoCostFactors,
  interventoHowItWorksSteps,
  interventoRequestTips,
  isGeoInterventoEnabled,
} from './_content'

export type {
  CostSignal,
  DetailedCostItem,
  FaqItem,
  GuideStep,
  InterventoContent,
  MaterialItem,
  PriceSummary,
  RealExample,
} from './_content'
