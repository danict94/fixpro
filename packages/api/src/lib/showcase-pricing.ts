/**
 * showcase-pricing.ts
 * Unica fonte di verità per il calcolo del costo crediti dei contatti vetrina.
 * NON replicare questa logica in controller, componenti o job.
 */

export type ShowcasePlanTier = 'BASE' | 'PLUS' | 'PRO'

/** Risultato del calcolo pricing vetrina */
export interface ShowcasePricingResult {
  baseCredits:   number
  finalCredits:  number
  savedCredits:  number
  isFree:        boolean
  discountLabel: string // es. "33%", "66%", "Gratuito (quota mensile)"
}

/**
 * Calcola il costo finale in crediti per un contatto da sorgente vetrina.
 *
 * @param baseCredits             Costo base in crediti della richiesta (ServiceRequest.creditCost)
 * @param tier                    Piano vetrina attivo dell'impresa
 * @param freeContactsUsedThisMonth  Quanti contatti gratuiti ha già usato questo mese (solo PRO)
 * @param freeContactsQuota       Quota gratuita mensile del piano (ShowcasePlan.freeContactsPerMonth)
 * @param overQuotaDiscountPercent Sconto oltre la quota gratuita (ShowcasePlan.overQuotaDiscountPercent)
 * @param discountPercent         Sconto del piano in percentuale (ShowcasePlan.discountPercent)
 */
export function calculateShowcaseContactCost(params: {
  baseCredits:                number
  tier:                       ShowcasePlanTier
  freeContactsUsedThisMonth:  number
  freeContactsQuota:          number
  overQuotaDiscountPercent:   number
  discountPercent:            number
}): ShowcasePricingResult {
  const {
    baseCredits,
    tier,
    freeContactsUsedThisMonth,
    freeContactsQuota,
    overQuotaDiscountPercent,
    discountPercent,
  } = params

  // PRO: gestione quota gratuita mensile
  if (tier === 'PRO') {
    if (freeContactsUsedThisMonth < freeContactsQuota) {
      return {
        baseCredits,
        finalCredits:  0,
        savedCredits:  baseCredits,
        isFree:        true,
        discountLabel: `Gratuito (quota mensile: ${freeContactsUsedThisMonth + 1}/${freeContactsQuota})`,
      }
    }
    // Oltre la quota: sconto overQuota (es. 70%)
    const finalCredits = Math.ceil(baseCredits * (1 - overQuotaDiscountPercent / 100))
    return {
      baseCredits,
      finalCredits,
      savedCredits:  baseCredits - finalCredits,
      isFree:        false,
      discountLabel: `-${overQuotaDiscountPercent}%`,
    }
  }

  // BASE (33%) e PLUS (66%)
  const finalCredits = Math.ceil(baseCredits * (1 - discountPercent / 100))
  return {
    baseCredits,
    finalCredits,
    savedCredits:  baseCredits - finalCredits,
    isFree:        false,
    discountLabel: `-${discountPercent}%`,
  }
}

/**
 * Verifica se un contatto proviene da sorgente vetrina.
 * Se sì, applica il pricing agevolato; se no, restituisce il costo base invariato.
 */
export function isShowcaseSource(sourceType: string): boolean {
  const SHOWCASE_SOURCES = [
    'SHOWCASE_PROFILE',
    'SHOWCASE_LISTING',
    'SHOWCASE_HOME_BLOCK',
    'SHOWCASE_CLIENT_DASHBOARD',
    'SHOWCASE_CATEGORY_PAGE',
  ]
  return SHOWCASE_SOURCES.includes(sourceType)
}

/**
 * Risultato del calcolo pricing unificato (crediti + one-time).
 * Usato da checkout, fulfill, webhook per tracciare audit trail.
 */
export interface UnlockPricingResult {
  credits: ShowcasePricingResult
  oneTime: {
    baseAmountCents: number
    finalAmountCents: number
    savedAmountCents: number
    isFree: boolean // true solo se PRO in quota
  }
  discountPercent: number // 0 se no showcase/not direct
  discountReason: string | null // 'SHOWCASE_PRO_FREE' | 'SHOWCASE_PRO_DISC_70' | ...
  planSnapshot: { tier: string; discountPercent: number; freeContactsPerMonth: number } | null
}

/**
 * Calcola il pricing unificato per sbloccare una richiesta.
 * Applica la tariffa vetrina sia ai crediti che al prezzo one-time.
 *
 * @param baseCredits             Costo base in crediti
 * @param baseAmountCents         Prezzo base one-time in centesimi
 * @param isShowcaseDirect        true se req.targetCompanyId === company.id
 * @param showcase                Piano vetrina attivo dell'impresa (se applicabile)
 * @returns UnlockPricingResult con prezzi calcolati, sconto, e snapshot piano
 */
export function calculateRequestUnlockPricing(params: {
  baseCredits: number
  baseAmountCents: number
  isShowcaseDirect: boolean
  showcase?: {
    tier: ShowcasePlanTier
    freeContactsUsedThisMonth: number
    freeContactsQuota: number
    overQuotaDiscountPercent: number
    discountPercent: number
  }
}): UnlockPricingResult {
  const { baseCredits, baseAmountCents, isShowcaseDirect, showcase } = params

  // Se non è diretta o showcase non attivo: prezzi base, no sconto
  if (!isShowcaseDirect || !showcase) {
    return {
      credits: {
        baseCredits,
        finalCredits: baseCredits,
        savedCredits: 0,
        isFree: false,
        discountLabel: '',
      },
      oneTime: {
        baseAmountCents,
        finalAmountCents: baseAmountCents,
        savedAmountCents: 0,
        isFree: false,
      },
      discountPercent: 0,
      discountReason: null,
      planSnapshot: null,
    }
  }

  const creditsPricing = calculateShowcaseContactCost({
    baseCredits,
    tier: showcase.tier,
    freeContactsUsedThisMonth: showcase.freeContactsUsedThisMonth,
    freeContactsQuota: showcase.freeContactsQuota,
    overQuotaDiscountPercent: showcase.overQuotaDiscountPercent,
    discountPercent: showcase.discountPercent,
  })

  let finalAmountCents = baseAmountCents
  let isFree = false
  let discountReason: string | null = null
  let appliedDiscountPercent = 0

  if (showcase.tier === 'PRO') {
    if (showcase.freeContactsUsedThisMonth < showcase.freeContactsQuota) {
      finalAmountCents = 0
      isFree = true
      appliedDiscountPercent = 100
      discountReason = 'SHOWCASE_PRO_FREE'
    } else {
      appliedDiscountPercent = showcase.overQuotaDiscountPercent
      finalAmountCents = Math.round(baseAmountCents * (1 - appliedDiscountPercent / 100))
      discountReason = `SHOWCASE_PRO_DISC_${appliedDiscountPercent}`
    }
  } else {
    appliedDiscountPercent = showcase.discountPercent
    finalAmountCents = Math.round(baseAmountCents * (1 - appliedDiscountPercent / 100))
    discountReason = `SHOWCASE_${showcase.tier}_${appliedDiscountPercent}`
  }

  const savedAmountCents = baseAmountCents - finalAmountCents

  return {
    credits: creditsPricing,
    oneTime: {
      baseAmountCents,
      finalAmountCents,
      savedAmountCents,
      isFree,
    },
    discountPercent: appliedDiscountPercent,
    discountReason,
    planSnapshot: {
      tier: showcase.tier,
      discountPercent: showcase.discountPercent,
      freeContactsPerMonth: showcase.freeContactsQuota,
    },
  }
}