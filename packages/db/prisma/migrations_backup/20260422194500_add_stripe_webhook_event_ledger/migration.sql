-- Add Stripe webhook event ledger for event-level idempotency
CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

-- Remove unused legacy showcase subscription field
ALTER TABLE "showcase_subscriptions"
DROP COLUMN IF EXISTS "stripeSubscriptionId";
