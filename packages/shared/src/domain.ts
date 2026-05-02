// Fasi di espansione del catalogo (docs/Taxonomy.md)
export const CatalogPhase = {
  CORE: 'CORE',
  ADJACENT: 'ADJACENT',
  VERTICAL: 'VERTICAL',
} as const

export type CatalogPhase = (typeof CatalogPhase)[keyof typeof CatalogPhase]

// Livelli tassonomici obbligatori: Settore -> Categoria -> Servizio
export const TaxonomyLevel = {
  SETTORE: 'SETTORE',
  CATEGORIA: 'CATEGORIA',
  SERVIZIO: 'SERVIZIO',
} as const

export type TaxonomyLevel = (typeof TaxonomyLevel)[keyof typeof TaxonomyLevel]

// Stati di una richiesta servizio
export const RequestStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FULFILLED: 'FULFILLED',
  EXPIRED: 'EXPIRED',
} as const

export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus]

// Stati di un'impresa
export const CompanyStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const

export type CompanyStatus = (typeof CompanyStatus)[keyof typeof CompanyStatus]

// Stati di un rescue/rimborso
export const RescueStatus = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CLOSED: 'CLOSED',
} as const

export type RescueStatus = (typeof RescueStatus)[keyof typeof RescueStatus]

// Tipo di movimento crediti
export const CreditMovementType = {
  PURCHASE: 'PURCHASE',       // acquisto pacchetto
  SPEND: 'SPEND',             // acquisto richiesta
  REFUND: 'REFUND',           // rimborso rescue
  BONUS: 'BONUS',             // assegnazione admin
  EXPIRY: 'EXPIRY',           // scadenza batch
} as const

export type CreditMovementType = (typeof CreditMovementType)[keyof typeof CreditMovementType]

// Canali di notifica
export const NotificationChannel = {
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP',
} as const

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel]

// Tipi di notifica
export const NotificationType = {
  NEW_REQUEST_IN_ZONE: 'NEW_REQUEST_IN_ZONE',
  CREDITS_LOW: 'CREDITS_LOW',
  CREDITS_EXPIRING: 'CREDITS_EXPIRING',
  RESCUE_APPROVED: 'RESCUE_APPROVED',
  RESCUE_REJECTED: 'RESCUE_REJECTED',
  ADMIN_MESSAGE: 'ADMIN_MESSAGE',
  CLIENT_MESSAGE: 'CLIENT_MESSAGE',
  PROMO_REQUEST: 'PROMO_REQUEST',
} as const

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]
