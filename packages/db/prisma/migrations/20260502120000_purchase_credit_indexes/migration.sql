-- Indice FIFO per consumo crediti attivi.
-- Aiuta spendCompanyCreditsTx quando cerca batch con remaining > 0 ordinati per expiresAt/createdAt.
CREATE INDEX IF NOT EXISTS "credit_batches_company_active_fifo_idx"
ON "credit_batches" ("companyId", "expiresAt", "createdAt")
WHERE "remaining" > 0;

-- Indice per conteggio contatti gratuiti Showcase PRO nel mese.
-- Usato in purchaseRequestWithCreditsTx quando calcola freeUsed.
CREATE INDEX IF NOT EXISTS "request_purchases_company_showcase_free_month_idx"
ON "request_purchases" ("companyId", "purchasedAt")
WHERE "discountReason" = 'SHOWCASE_PRO_FREE'
  AND "contactSourceType" <> 'MARKETPLACE_REQUEST';

-- Indice migliore per storico movimenti crediti ordinato per data.
-- Il model aveva già @@index([companyId]), questo aiuta query future per storico/audit.
CREATE INDEX IF NOT EXISTS "credit_movements_company_created_at_idx"
ON "credit_movements" ("companyId", "createdAt");