export { appRouter } from './root'
export type { AppRouter } from './root'
export {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  superAdminProcedure,
  companyProcedure,
  clientProcedure,
  createCallerFactory,
} from './trpc'
export type { Context } from './trpc'

export { calculateRequestUnlockPricing, calculateShowcaseContactCost } from './lib/showcase-pricing'
export type { UnlockPricingResult, ShowcasePricingResult } from './lib/showcase-pricing'

export {
  reserveRequestSlot,
  completeRequestSlotReservation,
  expireActiveRequestSlotReservations,
  expireRequestSlotReservation,
  isRequestSlotError,
  REQUEST_SLOT_ERROR_MESSAGES,
  REQUEST_SLOT_RESERVATION_TTL_MS,
  REQUEST_SLOT_RESERVATION_TTL_SECONDS,
} from './lib/request-slot-reservation'

export {
  lockCompanyCreditBalanceTx,
  syncCompanyCreditBalanceTx,
  getAvailableCreditBalance,
  getAvailableCreditBalanceReadOnly,
  getAvailableCreditBalanceReadOnlyTx,
} from './lib/credit-balance'

export { expireShowcaseSubscriptions } from './lib/showcase-subscription'
export { buildAdminEmail, sendAdminEmail } from './lib/admin-email'
export type { AdminEmailVariant } from './lib/admin-email'
export { sendWhatsAppNotification } from './lib/whatsapp'
export type { WhatsAppNotificationInput } from './lib/whatsapp'

export {
  ACTIVE_PUBLIC_SHOWCASE_TARGET_SELECT,
  buildActivePublicShowcaseCompanyWhere,
  getActivePublicShowcaseTargetById,
  getActivePublicShowcaseTargetBySlug,
} from './lib/public-showcase-company'

export type {
  ActivePublicShowcaseCompanyWhereInput,
  ActivePublicShowcaseTarget,
} from './lib/public-showcase-company'