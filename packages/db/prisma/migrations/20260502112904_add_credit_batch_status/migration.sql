-- CreateEnum
CREATE TYPE "CreditBatchStatus" AS ENUM ('PENDING', 'ACTIVE', 'VOIDED');

-- DropIndex
DROP INDEX "credit_batches_companyId_remaining_expiresAt_idx";

-- DropIndex
DROP INDEX "credit_movements_company_created_at_idx";

-- AlterTable
ALTER TABLE "credit_batches" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "status" "CreditBatchStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "stripeCaptureError" TEXT,
ADD COLUMN     "stripeCapturedAt" TIMESTAMP(3),
ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "credit_batches_companyId_status_remaining_expiresAt_idx" ON "credit_batches"("companyId", "status", "remaining", "expiresAt");

-- CreateIndex
CREATE INDEX "credit_batches_status_createdAt_idx" ON "credit_batches"("status", "createdAt");
