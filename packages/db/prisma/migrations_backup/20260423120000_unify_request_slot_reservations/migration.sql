DROP TABLE IF EXISTS "payment_intent_locks";

DROP TYPE IF EXISTS "PaymentIntentLockStatus";

CREATE TYPE "RequestSlotReservationStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');

CREATE TABLE "request_slot_reservations" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "status" "RequestSlotReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "request_slot_reservations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "request_slot_reservations_companyId_requestId_key"
  ON "request_slot_reservations"("companyId", "requestId");

CREATE INDEX "request_slot_reservations_requestId_status_idx"
  ON "request_slot_reservations"("requestId", "status");

CREATE INDEX "request_slot_reservations_status_expiresAt_idx"
  ON "request_slot_reservations"("status", "expiresAt");

CREATE INDEX "showcase_subscriptions_status_expiresAt_idx"
  ON "showcase_subscriptions"("status", "expiresAt");
