-- Create payment intent lock enum and table for request checkout deduplication
DO $$
BEGIN
  CREATE TYPE "PaymentIntentLockStatus" AS ENUM ('PENDING', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "payment_intent_locks" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "status" "PaymentIntentLockStatus" NOT NULL DEFAULT 'PENDING',
  "stripeCheckoutSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "expiresAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payment_intent_locks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payment_intent_locks_companyId_requestId_key"
ON "payment_intent_locks"("companyId", "requestId");

CREATE UNIQUE INDEX IF NOT EXISTS "payment_intent_locks_stripeCheckoutSessionId_key"
ON "payment_intent_locks"("stripeCheckoutSessionId");

CREATE UNIQUE INDEX IF NOT EXISTS "payment_intent_locks_stripePaymentIntentId_key"
ON "payment_intent_locks"("stripePaymentIntentId");

CREATE INDEX IF NOT EXISTS "payment_intent_locks_status_expiresAt_idx"
ON "payment_intent_locks"("status", "expiresAt");
