import type { ShowcasePlanSeed } from './seed-types'

export const showcasePlans: ShowcasePlanSeed[] = [
  {
    tier: 'BASE',
    name: 'Base',
    description:
      'Profilo pubblico, recensioni verificate e comparsa nelle sezioni base della vetrina. Sconto 33% sui contatti provenienti dalla vetrina.',
    monthlyPriceCents: 2990,
    yearlyPriceCents: 29000,
    discountPercent: 33,
    freeContactsPerMonth: 0,
    overQuotaDiscountPercent: 0,
    active: true,
  },
  {
    tier: 'PLUS',
    name: 'Plus',
    description:
      'Maggiore visibilità, più placement e profilo arricchito con cover e gallery. Sconto 66% sui contatti provenienti dalla vetrina.',
    monthlyPriceCents: 5990,
    yearlyPriceCents: 59000,
    discountPercent: 66,
    freeContactsPerMonth: 0,
    overQuotaDiscountPercent: 0,
    active: true,
  },
  {
    tier: 'PRO',
    name: 'Pro',
    description:
      'Massima visibilità, placement premium e priorità editoriale. 5 contatti vetrina gratuiti al mese, poi sconto 70%.',
    monthlyPriceCents: 9990,
    yearlyPriceCents: 99000,
    discountPercent: 0,
    freeContactsPerMonth: 5,
    overQuotaDiscountPercent: 70,
    active: true,
  },
]